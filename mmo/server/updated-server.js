import http from 'http';
import { WebSocketServer } from 'ws';
import { createSession, authenticateToken, invalidateSession } from './auth-manager.js';
import { movePlayerOnServer, validatePlayerPosition, isInAttackRange } from './world-authority.js';
import { movementLimiter, attackLimiter, chatLimiter, skillLimiter } from './rate-limiter.js';
import { validateMoveMessage, validateAttackMessage, validateChatMessage, validateJoinMessage, validateSkillMessage } from './message-validator.js';

const PORT = process.env.PORT || 8080;
const TICK_RATE = 30; // Server tick 30 times per second
const TICK_MS = 1000 / TICK_RATE;

// ==================== State ====================
const players = new Map();          // { playerId -> playerState }
const mobs = new Map();             // { mobId -> mobState }
const connections = new Map();      // { wsConnection -> playerId }
const tokenToPlayerId = new Map();  // { token -> playerId }

// ==================== HTTP Server ====================
const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Arelia Online Server is running.\n✓ WebSocket: ws://localhost:8080');
});

const wss = new WebSocketServer({ server: httpServer });

// ==================== Server Tick Loop ====================
let lastTickTime = Date.now();
setInterval(() => {
  const now = Date.now();
  const deltaTime = Math.min((now - lastTickTime) / 1000, 0.1);
  lastTickTime = now;

  // Update mobs AI
  for (const [mobId, mob] of mobs.entries()) {
    if (mob.alive) {
      updateMobAI(mob, deltaTime);
    }
  }

  // Broadcast snapshot to all authenticated clients
  broadcastSnapshot();
}, TICK_MS);

// ==================== Player State Management ====================
function createPlayerState(session, classData) {
  return {
    id: session.id,
    token: session.token,
    name: session.name,
    class: session.class,
    x: 550,
    y: 340,
    r: 15,
    hp: classData.stats.hp,
    maxHp: classData.stats.hp,
    mp: classData.stats.mp,
    maxMp: classData.stats.mp,
    speed: classData.stats.speed,
    attack: classData.stats.attack,
    defense: classData.stats.defense,
    gold: 100,
    xp: 0,
    level: 1,
    alive: true,
    inventory: [],
    equipment: { weapon: null, armor: null },
    quests: [],
    lastMoveTime: Date.now(),
    inputKeys: {}
  };
}

// ==================== WebSocket Events ====================
wss.on('connection', (ws) => {
  console.log('[WS] New connection established');
  connections.set(ws, null); // Temporarily null until authenticated

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      handleMessage(ws, msg);
    } catch (err) {
      console.error('[WS] Message parse error:', err.message);
      ws.send(JSON.stringify({ type: 'error', text: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    const playerId = connections.get(ws);
    if (playerId) {
      const player = players.get(playerId);
      if (player) {
        invalidateSession(player.token);
        tokenToPlayerId.delete(player.token);
        players.delete(playerId);
        console.log(`[WS] Player ${player.name} disconnected`);
      }
    }
    connections.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('[WS] Connection error:', err.message);
  });
});

// ==================== Message Handling ====================
function handleMessage(ws, msg) {
  const messageType = msg.type;

  if (messageType === 'join') {
    handleJoin(ws, msg);
  } else {
    // All other messages require authentication
    const playerId = connections.get(ws);
    if (!playerId) {
      ws.send(JSON.stringify({ type: 'error', text: 'Not authenticated. Send join message first.' }));
      return;
    }

    const player = players.get(playerId);
    if (!player) {
      ws.send(JSON.stringify({ type: 'error', text: 'Player not found' }));
      return;
    }

    switch (messageType) {
      case 'move':
        handleMove(player, msg);
        break;
      case 'attack':
        handleAttack(player, msg);
        break;
      case 'skill':
        handleSkill(player, msg);
        break;
      case 'chat':
        handleChat(player, msg);
        break;
      case 'interact':
        handleInteract(player, msg);
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', text: `Unknown message type: ${messageType}` }));
    }
  }
}

function handleJoin(ws, msg) {
  try {
    const validated = validateJoinMessage(msg);
    const session = createSession(validated.playerName, validated.playerClass);

    // ดึง class data จากข้อมูล static
    const classData = getClassData(validated.playerClass);
    const playerState = createPlayerState(session, classData);

    players.set(session.id, playerState);
    tokenToPlayerId.set(session.token, session.id);
    connections.set(ws, session.id);

    // ส่ง welcome + token + current players snapshot
    const snapshot = createPlayerSnapshot();
    ws.send(JSON.stringify({
      type: 'welcome',
      playerId: session.id,
      token: session.token,
      playerName: playerState.name,
      playerClass: playerState.class,
      players: snapshot.players,
      mobs: snapshot.mobs
    }));

    console.log(`[AUTH] Player ${playerState.name} joined - Token: ${session.token.substring(0, 8)}...`);
  } catch (err) {
    console.error('[AUTH] Join error:', err.message);
    ws.send(JSON.stringify({ type: 'error', text: err.message }));
  }
}

function handleMove(player, msg) {
  try {
    // Rate limit
    if (!movementLimiter.isAllowed(player.id)) {
      return; // Silently drop
    }

    const validated = validateMoveMessage(msg);
    player.inputKeys = validated.keys;
  } catch (err) {
    console.error('[MOVE] Error:', err.message);
  }
}

function handleAttack(player, msg) {
  try {
    // Rate limit
    if (!attackLimiter.isAllowed(player.id)) {
      return;
    }

    const validated = validateAttackMessage(msg);
    let target = null;

    if (validated.targetId) {
      target = players.get(validated.targetId) || mobs.get(validated.targetId);
    }

    if (!target) {
      return; // No valid target
    }

    // Server Authority: ตรวจสอบ range + คำนวณ damage
    if (!isInAttackRange(player, target)) {
      return; // Out of range
    }

    // Calculate damage: attack - defense + random variation
    const baseDamage = Math.max(1, player.attack - target.defense);
    const variance = Math.random() * 10 - 5; // -5 to +5
    const finalDamage = Math.max(1, Math.round(baseDamage + variance));

    target.hp = Math.max(0, target.hp - finalDamage);
    if (target.hp === 0) {
      target.alive = false;
    }

    // Broadcast attack result
    broadcast({
      type: 'attack_result',
      attackerId: player.id,
      targetId: target.id,
      damage: finalDamage,
      targetHp: target.hp
    });
  } catch (err) {
    console.error('[ATTACK] Error:', err.message);
  }
}

function handleSkill(player, msg) {
  try {
    if (!skillLimiter.isAllowed(player.id)) {
      return;
    }

    const validated = validateSkillMessage(msg);
    // TODO: Implement skill system
    console.log(`[SKILL] ${player.name} used ${validated.skillId}`);
  } catch (err) {
    console.error('[SKILL] Error:', err.message);
  }
}

function handleChat(player, msg) {
  try {
    if (!chatLimiter.isAllowed(player.id)) {
      return;
    }

    const validated = validateChatMessage(msg);
    broadcast({
      type: 'chat',
      playerId: player.id,
      playerName: player.name,
      text: validated.text
    });
  } catch (err) {
    console.error('[CHAT] Error:', err.message);
  }
}

function handleInteract(player, msg) {
  try {
    const validated = msg; // TODO: validate
    // TODO: Implement NPC interaction
    console.log(`[INTERACT] ${player.name} interacted with ${validated.targetId}`);
  } catch (err) {
    console.error('[INTERACT] Error:', err.message);
  }
}

// ==================== Server Simulation ====================
function updatePlayerMovement(player, deltaTime) {
  const classData = getClassData(player.class);
  movePlayerOnServer(player, player.inputKeys, deltaTime, classData);
}

function updateMobAI(mob, deltaTime) {
  // Simple random walk AI
  if (Math.random() < 0.1) {
    mob.targetAngle = Math.random() * Math.PI * 2;
  }

  const speed = mob.speed || 100;
  mob.x += Math.cos(mob.targetAngle || 0) * speed * deltaTime;
  mob.y += Math.sin(mob.targetAngle || 0) * speed * deltaTime;

  // Keep within bounds
  const validated = validatePlayerPosition(mob, deltaTime);
  mob.x = validated.x;
  mob.y = validated.y;
}

// ==================== Broadcasting ====================
function createPlayerSnapshot() {
  const playersData = [];
  for (const player of players.values()) {
    playersData.push({
      id: player.id,
      name: player.name,
      class: player.class,
      x: player.x,
      y: player.y,
      r: player.r,
      hp: player.hp,
      maxHp: player.maxHp,
      alive: player.alive
    });
  }

  const mobsData = [];
  for (const mob of mobs.values()) {
    mobsData.push({
      id: mob.id,
      type: mob.type,
      x: mob.x,
      y: mob.y,
      r: mob.r,
      hp: mob.hp,
      maxHp: mob.maxHp,
      alive: mob.alive
    });
  }

  return { players: playersData, mobs: mobsData };
}

function broadcastSnapshot() {
  // Update all players' positions based on input
  for (const player of players.values()) {
    if (player.alive) {
      updatePlayerMovement(player, TICK_MS / 1000);
    }
  }

  const snapshot = createPlayerSnapshot();
  broadcast({
    type: 'snapshot',
    players: snapshot.players,
    mobs: snapshot.mobs
  });
}

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const ws of wss.clients) {
    if (ws.readyState === 1) { // OPEN
      ws.send(data);
    }
  }
}

// ==================== Static Data ====================
function getClassData(className) {
  const classesData = {
    warrior: {
      name: 'Warrior',
      stats: { hp: 140, mp: 70, attack: 12, defense: 6, speed: 155 },
      skills: ['slash', 'guard']
    },
    mage: {
      name: 'Mage',
      stats: { hp: 90, mp: 130, attack: 16, defense: 3, speed: 145 },
      skills: ['fireball', 'heal']
    },
    rogue: {
      name: 'Rogue',
      stats: { hp: 105, mp: 85, attack: 14, defense: 4, speed: 180 },
      skills: ['quick-strike', 'evade']
    }
  };

  return classesData[className] || classesData.warrior;
}

// ==================== Startup ====================
httpServer.listen(PORT, () => {
  console.log(`\n🎮 Arelia Online Server v0.2.0`);
  console.log(`✓ HTTP: http://localhost:${PORT}`);
  console.log(`✓ WebSocket: ws://localhost:${PORT}`);
  console.log(`✓ Auth: ✅ Enabled`);
  console.log(`✓ Server Authority: ✅ Enabled`);
  console.log(`✓ Rate Limiting: ✅ Enabled`);
  console.log(`✓ Message Validation: ✅ Enabled\n`);
});
