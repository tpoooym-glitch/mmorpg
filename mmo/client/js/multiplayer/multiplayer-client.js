import { state } from '../core/state.js';
import { emit } from '../core/event-bus.js';

/**
 * Multiplayer Client: WebSocket wrapper
 * - Handles connection, authentication, reconnection
 * - Sends input keys instead of position
 * - Receives snapshot from server + interpolates
 * - Client-side prediction for smooth gameplay
 */

let ws = null;
let playerId = null;
let playerToken = null;
let isConnected = false;
let playerName = 'Adventurer';
let playerClass = 'Warrior';

const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:8080';
const RECONNECT_INTERVAL = 3000;
const INTERPOLATION_FACTOR = 0.15; // 15% towards target position each frame

const remotePlayerCache = new Map();  // { playerId -> { ...state, targetX, targetY } }
const remotePlayerSnapshots = new Map(); // Historical snapshots for interpolation

// ==================== Connection ====================
export function connect(name, selectedClass) {
  return new Promise((resolve, reject) => {
    if (ws?.readyState === WebSocket.OPEN) {
      reject(new Error('Already connected'));
      return;
    }

    playerName = name || 'Adventurer';
    playerClass = selectedClass || 'Warrior';

    ws = new WebSocket(SERVER_URL);

    ws.onopen = () => {
      console.log('[MP] Connected to server');
      isConnected = true;
      sendJoinMessage();
      resolve();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerMessage(msg);
      } catch (err) {
        console.error('[MP] Message parse error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[MP] Connection error:', err);
      emit('multiplayer_error', { message: 'Connection error' });
      reject(err);
    };

    ws.onclose = () => {
      console.log('[MP] Connection closed');
      isConnected = false;
      emit('multiplayer_disconnected');
      reconnect();
    };

    setTimeout(() => reject(new Error('Connection timeout')), 10000);
  });
}

function sendJoinMessage() {
  const msg = {
    type: 'join',
    playerName: playerName,
    playerClass: playerClass
  };
  send(msg);
}

function reconnect() {
  console.log('[MP] Attempting reconnect in 3s...');
  setTimeout(() => {
    if (!isConnected) {
      connect(playerName, playerClass).catch(err => {
        console.error('[MP] Reconnect failed:', err);
      });
    }
  }, RECONNECT_INTERVAL);
}

// ==================== Sending ====================
export function sendMove(keys) {
  if (!isConnected) return;
  send({
    type: 'move',
    keys: keys
  });
}

export function sendAttack(targetId) {
  if (!isConnected) return;
  send({
    type: 'attack',
    targetId: targetId
  });
}

export function sendSkill(skillId, targetId) {
  if (!isConnected) return;
  send({
    type: 'skill',
    skillId: skillId,
    targetId: targetId
  });
}

export function sendChat(text) {
  if (!isConnected) return;
  send({
    type: 'chat',
    text: text
  });
}

export function sendInteract(targetId) {
  if (!isConnected) return;
  send({
    type: 'interact',
    targetId: targetId
  });
}

function send(msg) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

// ==================== Receiving ====================
function handleServerMessage(msg) {
  switch (msg.type) {
    case 'welcome':
      handleWelcome(msg);
      break;
    case 'snapshot':
      handleSnapshot(msg);
      break;
    case 'attack_result':
      handleAttackResult(msg);
      break;
    case 'chat':
      handleChat(msg);
      break;
    case 'error':
      console.error('[MP] Server error:', msg.text);
      emit('multiplayer_error', msg);
      break;
    default:
      console.warn('[MP] Unknown message type:', msg.type);
  }
}

function handleWelcome(msg) {
  playerId = msg.playerId;
  playerToken = msg.token;
  state.player.name = msg.playerName;
  state.player.class = msg.playerClass;

  console.log(`[MP] Welcome! ID: ${playerId}, Token: ${playerToken?.substring(0, 8)}...`);
  console.log(`[MP] Playing as: ${msg.playerName} (${msg.playerClass})`);

  // Initialize remote players
  if (msg.players) {
    for (const p of msg.players) {
      if (p.id !== playerId) {
        remotePlayerCache.set(p.id, {
          ...p,
          targetX: p.x,
          targetY: p.y
        });
      }
    }
  }

  emit('multiplayer_joined', { playerId, playerName: msg.playerName, playerClass: msg.playerClass });
}

function handleSnapshot(msg) {
  // Update player positions
  if (msg.players) {
    for (const p of msg.players) {
      if (p.id === playerId) {
        // Update own player from server (server authority)
        state.player.x = p.x;
        state.player.y = p.y;
        state.player.hp = p.hp;
      } else {
        // Other players: interpolate towards new position
        const remote = remotePlayerCache.get(p.id) || createRemotePlayer(p);
        remote.targetX = p.x;
        remote.targetY = p.y;
        remote.hp = p.hp;
        remote.alive = p.alive;
        remotePlayerCache.set(p.id, remote);
      }
    }
  }

  // Update mobs
  if (msg.mobs) {
    state.mobs = msg.mobs.map(m => ({
      id: m.id,
      type: m.type,
      x: m.x,
      y: m.y,
      r: m.r,
      hp: m.hp,
      maxHp: m.maxHp,
      alive: m.alive
    }));
  }

  emit('multiplayer_snapshot', { players: msg.players, mobs: msg.mobs });
}

function handleAttackResult(msg) {
  const target = remotePlayerCache.get(msg.targetId) || state.mobs.find(m => m.id === msg.targetId);
  if (target) {
    target.hp = msg.targetHp;
  }
  emit('attack_result', msg);
}

function handleChat(msg) {
  emit('chat_message', {
    playerId: msg.playerId,
    playerName: msg.playerName,
    text: msg.text
  });
}

// ==================== Interpolation ====================
export function interpolateRemotePlayers() {
  for (const [playerId, player] of remotePlayerCache.entries()) {
    if (player.targetX !== undefined && player.targetY !== undefined) {
      // Linear interpolation towards target
      player.x += (player.targetX - player.x) * INTERPOLATION_FACTOR;
      player.y += (player.targetY - player.y) * INTERPOLATION_FACTOR;
    }
  }
}

export function getRemotePlayers() {
  return Array.from(remotePlayerCache.values());
}

function createRemotePlayer(data) {
  return {
    id: data.id,
    name: data.name,
    class: data.class,
    x: data.x,
    y: data.y,
    targetX: data.x,
    targetY: data.y,
    r: data.r,
    hp: data.hp,
    maxHp: data.maxHp,
    alive: data.alive
  };
}

// ==================== State ====================
export function getConnectionState() {
  return {
    isConnected,
    playerId,
    playerToken,
    playerName,
    playerClass
  };
}

export function disconnect() {
  if (ws) {
    ws.close();
    ws = null;
    isConnected = false;
  }
}
