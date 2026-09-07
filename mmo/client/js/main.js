const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const keys = {};

const player = {
  x: 1600, y: 1180, radius: 15, baseSpeed: 180,
  hp: 100, maxHp: 100, mp: 50, maxMp: 50,
  gold: 100, xp: 0, level: 1, name: 'Adventurer', class: 'Warrior'
};

let zone = null;
let mobs = [];
let camera = { x: 0, y: 0 };
let loadError = '';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const distance = (a, b, c, d) => Math.hypot(a - c, b - d);

async function loadZone() {
  try {
    const response = await fetch('../../maps/emerald-vales.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    zone = await response.json();
    player.x = zone.spawn.x;
    player.y = zone.spawn.y;
    createMobs();
  } catch (error) {
    loadError = `Unable to load Emerald Vales: ${error.message}`;
    zone = {
      name: 'Emerald Vales', width: 3200, height: 2400,
      spawn: { x: 1600, y: 1180 }, terrain: { regions: [] },
      water: [], roads: [], bridges: [], structures: [], resources: [], landmarks: [],
      collision: { default: 'walkable', blocked: [], water: 'slow', deepWater: 'danger' },
      movement: { grassMultiplier: 1, forestMultiplier: .85, swampMultiplier: .65, waterMultiplier: .45, roadMultiplier: 1.15, bridgeMultiplier: 1 }
    };
  }
}

function createMobs() {
  const spots = [
    [420, 520], [680, 840], [900, 520], [1120, 1450], [1380, 1560],
    [1900, 760], [2140, 1380], [2480, 720], [2720, 1460], [2900, 1720],
    [560, 1820], [820, 2040], [2200, 2020], [2700, 2120]
  ];
  mobs = spots.map((p, i) => ({
    x: p[0], y: p[1], r: 16, hp: 40, maxHp: 40,
    type: i % 3 === 0 ? 'Slime' : i % 3 === 1 ? 'Forest Boar' : 'Greenling'
  }));
}

addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') { e.preventDefault(); attack(); }
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function pointNearSegment(px, py, ax, ay, bx, by, radius) {
  const abx = bx - ax, aby = by - ay;
  const len2 = abx * abx + aby * aby || 1;
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / len2, 0, 1);
  const x = ax + t * abx, y = ay + t * aby;
  return distance(px, py, x, y) <= radius;
}

function nearPolyline(x, y, points, radius) {
  for (let i = 1; i < points.length; i++) {
    if (pointNearSegment(x, y, points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], radius)) return true;
  }
  return false;
}

function isBridge(x, y) {
  return (zone.bridges || []).some(b => pointInRect(x, y, b));
}

function terrainAt(x, y) {
  if (!zone) return 'grass';
  if (isBridge(x, y)) return 'bridge';
  if ((zone.water || []).some(w => w.type === 'pond' && pointInRect(x, y, w))) return 'water';
  if ((zone.water || []).some(w => w.type === 'river' && nearPolyline(x, y, w.points, 42))) return 'water';
  if ((zone.roads || []).some(r => nearPolyline(x, y, r.points, 34))) return 'road';
  const regions = zone.terrain?.regions || [];
  for (let i = regions.length - 1; i >= 0; i--) {
    const r = regions[i];
    if (pointInRect(x, y, r)) return r.type;
  }
  return zone.terrain?.base || 'grass';
}

function movementMultiplier(type) {
  return zone?.movement?.[`${type}Multiplier`] ?? 1;
}

function blockedAt(x, y) {
  if (!zone) return false;
  if (x < player.radius || y < player.radius || x > zone.width - player.radius || y > zone.height - player.radius) return true;
  if (isBridge(x, y)) return false;
  for (const s of zone.structures || []) {
    const pad = 16;
    if (pointInRect(x, y, { x: s.x - pad, y: s.y - pad, w: s.w + pad * 2, h: s.h + pad * 2 })) return true;
  }
  return false;
}

function movePlayer(dx, dy, dt) {
  if (!zone) return;
  let nx = player.x + dx * player.baseSpeed * movementMultiplier(terrainAt(player.x, player.y)) * dt;
  let ny = player.y + dy * player.baseSpeed * movementMultiplier(terrainAt(player.x, player.y)) * dt;
  if (!blockedAt(nx, player.y)) player.x = nx;
  if (!blockedAt(player.x, ny)) player.y = ny;
}

function attack() {
  for (const mob of mobs) {
    if (mob.hp > 0 && distance(mob.x, mob.y, player.x, player.y) < 78) {
      mob.hp -= 20;
      if (mob.hp <= 0) {
        player.xp += 20;
        player.gold += 5;
        if (player.xp >= 100) {
          player.xp -= 100;
          player.level++;
          player.maxHp += 10;
          player.hp = player.maxHp;
        }
      }
    }
  }
}

function update(dt) {
  if (!zone) return;
  let dx = 0, dy = 0;
  if (keys.w || keys.arrowup) dy--;
  if (keys.s || keys.arrowdown) dy++;
  if (keys.a || keys.arrowleft) dx--;
  if (keys.d || keys.arrowright) dx++;
  if (dx && dy) { dx *= 0.707; dy *= 0.707; }
  movePlayer(dx, dy, dt);

  const t = terrainAt(player.x, player.y);
  if (t === 'water' && Math.random() < dt * 0.05) player.hp = Math.max(0, player.hp - 1);
}

function worldToScreen(x, y) { return [x - camera.x, y - camera.y]; }

function drawRoad(points) {
  if (!points?.length) return;
  ctx.beginPath();
  points.forEach((p, i) => { const [x, y] = worldToScreen(p[0], p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 64;
  ctx.strokeStyle = '#b88752';
  ctx.stroke();
  ctx.lineWidth = 54;
  ctx.strokeStyle = '#d6a66c';
  ctx.stroke();
}

function drawRiver(points) {
  if (!points?.length) return;
  ctx.beginPath();
  points.forEach((p, i) => { const [x, y] = worldToScreen(p[0], p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 94;
  ctx.strokeStyle = '#356b75';
  ctx.stroke();
  ctx.lineWidth = 78;
  ctx.strokeStyle = '#5da9b7';
  ctx.stroke();
}

function drawNature() {
  // Deterministic decoration pattern: visual placeholders until the generated sprite assets are installed.
  const seed = 17;
  for (let i = 0; i < 180; i++) {
    const x = ((i * 197 + seed * 31) % 3050) + 70;
    const y = ((i * 113 + seed * 17) % 2220) + 70;
    if (terrainAt(x, y) !== 'forest') continue;
    const [sx, sy] = worldToScreen(x, y);
    if (sx < -60 || sy < -80 || sx > canvas.width + 60 || sy > canvas.height + 80) continue;
    ctx.fillStyle = '#315f36';
    ctx.beginPath(); ctx.arc(sx, sy - 12, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5e8d42';
    ctx.beginPath(); ctx.arc(sx - 9, sy - 19, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#70452f'; ctx.fillRect(sx - 5, sy, 10, 22);
  }
  for (let i = 0; i < 75; i++) {
    const x = ((i * 337 + 401) % 3050) + 60;
    const y = ((i * 173 + 89) % 2250) + 60;
    if (terrainAt(x, y) !== 'grass') continue;
    const [sx, sy] = worldToScreen(x, y);
    if (sx < -20 || sy < -20 || sx > canvas.width + 20 || sy > canvas.height + 20) continue;
    ctx.fillStyle = '#7c7c70';
    ctx.beginPath(); ctx.ellipse(sx, sy, 10, 7, -0.2, 0, Math.PI * 2); ctx.fill();
  }
}

function drawStructures() {
  for (const s of zone.structures || []) {
    const [x, y] = worldToScreen(s.x, s.y);
    ctx.fillStyle = '#8b5a3c'; ctx.fillRect(x, y, s.w, s.h);
    ctx.fillStyle = '#c98955';
    ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + s.w / 2, y - 48); ctx.lineTo(x + s.w + 10, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f1d39b'; ctx.fillRect(x + s.w * 0.42, y + s.h * 0.45, s.w * 0.16, s.h * 0.55);
    ctx.fillStyle = '#fff'; ctx.font = '12px system-ui'; ctx.fillText(s.type === 'village' ? 'Vale Camp' : 'House', x, y + s.h + 18);
  }
}

function drawResources() {
  for (const r of zone.resources || []) {
    const [x, y] = worldToScreen(r.x, r.y);
    ctx.fillStyle = r.type === 'ore' ? '#9aa1aa' : '#72a84b';
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
  }
}

function draw() {
  if (!zone) {
    ctx.fillStyle = '#17252a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff'; ctx.font = '18px system-ui'; ctx.fillText('Loading Emerald Vales…', 30, 40);
    return;
  }

  camera.x = clamp(player.x - canvas.width / 2, 0, Math.max(0, zone.width - canvas.width));
  camera.y = clamp(player.y - canvas.height / 2, 0, Math.max(0, zone.height - canvas.height));

  ctx.fillStyle = '#79a84a'; ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const r of zone.terrain?.regions || []) {
    const [x, y] = worldToScreen(r.x, r.y);
    const colors = { grass: '#79a84a', forest: '#3f713e', swamp: '#607b52', desert: '#c5a65c', snow: '#d9e5df', volcano: '#754d3f', mountain: '#65705e', water: '#5da9b7' };
    ctx.fillStyle = colors[r.type] || '#79a84a';
    ctx.fillRect(x, y, r.w, r.h);
  }

  for (const w of zone.water || []) {
    if (w.type === 'river') drawRiver(w.points);
    else {
      const [x, y] = worldToScreen(w.x, w.y);
      ctx.fillStyle = '#5da9b7'; ctx.beginPath(); ctx.ellipse(x + w.w / 2, y + w.h / 2, w.w / 2, w.h / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#9bd4dc'; ctx.lineWidth = 4; ctx.stroke();
    }
  }

  for (const r of zone.roads || []) drawRoad(r.points);
  for (const b of zone.bridges || []) {
    const [x, y] = worldToScreen(b.x, b.y);
    ctx.fillStyle = '#795548'; ctx.fillRect(x, y, b.w, b.h);
    ctx.strokeStyle = '#d4a373'; ctx.lineWidth = 5; ctx.strokeRect(x, y, b.w, b.h);
  }

  drawNature();
  drawResources();
  drawStructures();

  for (const mob of mobs) {
    if (mob.hp <= 0) continue;
    const [x, y] = worldToScreen(mob.x, mob.y);
    if (x < -30 || y < -30 || x > canvas.width + 30 || y > canvas.height + 30) continue;
    ctx.fillStyle = '#86b84d'; ctx.beginPath(); ctx.arc(x, y, mob.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1f2937'; ctx.fillRect(x - 15, y - 25, 30, 4);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(x - 15, y - 25, 30 * (mob.hp / mob.maxHp), 4);
  }

  const [px, py] = worldToScreen(player.x, player.y);
  ctx.fillStyle = '#f4c2a1'; ctx.beginPath(); ctx.arc(px, py, player.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '12px system-ui'; ctx.fillText(player.name, px - 35, py - 24);

  ctx.fillStyle = '#ffffffdd'; ctx.font = 'bold 18px system-ui'; ctx.fillText(zone.name, 18, 28);
  if (loadError) { ctx.fillStyle = '#ffdddd'; ctx.font = '12px system-ui'; ctx.fillText(loadError, 18, 48); }
}

function ui() {
  document.querySelector('#character').textContent = `${player.name} · ${player.class} · Lv.${player.level}`;
  document.querySelector('#hp').textContent = `${Math.max(0, Math.round(player.hp))}/${player.maxHp}`;
  document.querySelector('#mp').textContent = `${player.mp}/${player.maxMp}`;
  document.querySelector('#gold').textContent = player.gold;
  document.querySelector('#xp').textContent = `${player.xp}/100`;
  document.querySelector('#hpbar').style.width = `${player.hp / player.maxHp * 100}%`;
  document.querySelector('#mpbar').style.width = `${player.mp / player.maxMp * 100}%`;
}

let last = performance.now();
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  update(dt); draw(); ui(); requestAnimationFrame(loop);
}

loadZone();
requestAnimationFrame(loop);
