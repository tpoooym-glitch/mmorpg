/**
 * Updated Canvas Renderer
 * - Render players, mobs, terrain, buildings
 * - Use fallback shapes if sprites missing
 * - Render damage numbers
 * - Camera follow player
 */

import { getSprite, hasSprite, FALLBACK_SHAPES } from './asset-loader.js';
import { state } from '../core/state.js';
import { getRemotePlayers } from '../multiplayer/multiplayer-client.js';

const damageNumbers = [];
const MAX_DAMAGE_DURATION = 1000; // ms

export function drawScene(ctx, gameState, assets) {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.fillStyle = '#0b1020';
  ctx.fillRect(0, 0, width, height);

  // Update camera (follow player)
  gameState.cam.x = gameState.player.x - width / 2;
  gameState.cam.y = gameState.player.y - height / 2;

  // ==================== Draw Terrain ====================
  drawTerrain(ctx, gameState);

  // ==================== Draw Buildings/Decor ====================
  if (gameState.decor) {
    for (const decor of gameState.decor) {
      drawEntity(ctx, gameState, decor);
    }
  }

  // ==================== Draw Mobs ====================
  if (gameState.mobs) {
    for (const mob of gameState.mobs) {
      if (mob.alive) {
        drawEntity(ctx, gameState, mob);
      }
    }
  }

  // ==================== Draw Other Players ====================
  const remotePlayers = getRemotePlayers();
  for (const player of remotePlayers) {
    if (player.alive) {
      drawEntity(ctx, gameState, player, player.class);
    }
  }

  // ==================== Draw Player ====================
  drawEntity(ctx, gameState, gameState.player, gameState.player.class);

  // ==================== Draw Damage Numbers ====================
  drawDamageNumbers(ctx, gameState);

  // ==================== Draw HUD ====================
  drawHUD(ctx, gameState, width, height);
}

function drawTerrain(ctx, gameState) {
  if (!gameState.zone) return;

  // Draw background (simple fill)
  ctx.fillStyle = '#1a2844';
  ctx.fillRect(
    -gameState.cam.x,
    -gameState.cam.y,
    2200,
    1400
  );

  // Draw terrain zones if available
  if (gameState.zone.terrain) {
    for (const tile of gameState.zone.terrain) {
      const x = tile.x - gameState.cam.x;
      const y = tile.y - gameState.cam.y;

      ctx.fillStyle = getTileColor(tile.type);
      ctx.fillRect(x, y, tile.width, tile.height);
    }
  }
}

function getTileColor(terrainType) {
  const colors = {
    grass: '#2a7a3a',
    forest: '#1a5a2a',
    water: '#1a5a9a',
    sand: '#c9a961',
    rock: '#6a6a6a'
  };
  return colors[terrainType] || '#3a4a5a';
}

function drawEntity(ctx, gameState, entity, className) {
  const x = entity.x - gameState.cam.x;
  const y = entity.y - gameState.cam.y;
  const r = entity.r || 16;

  // Determine sprite name
  let spriteName = entity.type === 'player' ? className : entity.type;

  // Try to use sprite, fallback to shape
  if (hasSprite(spriteName)) {
    const sprite = getSprite(spriteName);
    if (sprite) {
      ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
    }
  } else {
    drawFallbackShape(ctx, spriteName, x, y, r);
  }

  // Draw HP bar above entity
  if (entity.hp !== undefined && entity.maxHp !== undefined) {
    drawHPBar(ctx, x, y - r - 10, r * 2, 4, entity.hp, entity.maxHp);
  }

  // Draw name label
  if (entity.name) {
    ctx.fillStyle = '#eef2ff';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(entity.name, x, y + r + 15);
  }
}

function drawFallbackShape(ctx, name, x, y, size) {
  const shape = FALLBACK_SHAPES[name] || FALLBACK_SHAPES.player;

  ctx.fillStyle = shape.color || '#0088ff';
  ctx.globalAlpha = 0.8;

  switch (shape.type) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x - size, y + size);
      ctx.fill();
      break;
    case 'rect':
      ctx.fillRect(x - shape.width / 2, y - shape.height / 2, shape.width, shape.height);
      break;
    case 'square':
      const halfSize = size / 2;
      ctx.fillRect(x - halfSize, y - halfSize, size, size);
      break;
  }

  ctx.globalAlpha = 1;
}

function drawHPBar(ctx, x, y, width, height, hp, maxHp) {
  const hpPercent = Math.max(0, hp / maxHp);

  // Background (dark)
  ctx.fillStyle = '#333333';
  ctx.fillRect(x - width / 2, y, width, height);

  // HP bar (green/red)
  const color = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2, y, width * hpPercent, height);

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - width / 2, y, width, height);
}

export function addDamageNumber(targetId, damage, isCrit, x, y) {
  damageNumbers.push({
    targetId,
    damage,
    isCrit,
    x,
    y,
    startTime: Date.now(),
    offsetY: 0
  });
}

function drawDamageNumbers(ctx, gameState) {
  const now = Date.now();
  const stillActive = [];

  for (const dmg of damageNumbers) {
    const elapsed = now - dmg.startTime;
    if (elapsed > MAX_DAMAGE_DURATION) continue; // Remove old ones

    const progress = elapsed / MAX_DAMAGE_DURATION;
    const opacity = 1 - progress;
    const offsetY = progress * 30; // Float upward

    const x = dmg.x - gameState.cam.x;
    const y = dmg.y - gameState.cam.y - offsetY;

    ctx.globalAlpha = opacity;
    ctx.fillStyle = dmg.isCrit ? '#ffff00' : '#ff0000';
    ctx.font = `bold ${dmg.isCrit ? 18 : 14}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(dmg.damage, x, y);
    ctx.globalAlpha = 1;

    stillActive.push(dmg);
  }

  damageNumbers.length = 0;
  damageNumbers.push(...stillActive);
}

function drawHUD(ctx, gameState, width, height) {
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#eef2ff';
  ctx.font = '12px system-ui';

  // Player stats (top-left)
  const y = 20;
  ctx.fillText(`HP: ${gameState.player.hp}/${gameState.player.maxHp}`, 10, y);
  ctx.fillText(`MP: ${gameState.player.mp}/${gameState.player.maxMp}`, 10, y + 15);
  ctx.fillText(`Gold: ${gameState.player.gold}`, 10, y + 30);
  ctx.fillText(`Lv. ${gameState.player.level}`, 10, y + 45);
}
