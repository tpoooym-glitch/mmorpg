/**
 * Updated Canvas Renderer
 * - Render grass terrain
 * - Render decor (trees, rocks)
 * - Render player
 * - Fallback shapes if sprites missing
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

  // Clear canvas to sky blue
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, 0, width, height);

  // Update camera (follow player)
  gameState.cam.x = gameState.player.x - width / 2;
  gameState.cam.y = gameState.player.y - height / 2;

  // ==================== Draw Terrain ====================
  drawTerrain(ctx, gameState);

  // ==================== Draw Decor (Trees, Rocks) ====================
  if (gameState.decor) {
    // Sort by Y position for proper depth
    const sortedDecor = [...gameState.decor].sort((a, b) => a.y - b.y);
    for (const decor of sortedDecor) {
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
  if (!gameState.zone || !gameState.zone.terrain) {
    // Fallback: solid green grass
    ctx.fillStyle = '#4a9d6f';
    ctx.fillRect(
      -gameState.cam.x,
      -gameState.cam.y,
      2200,
      1400
    );
    return;
  }

  // Draw terrain tiles
  for (const tile of gameState.zone.terrain) {
    const x = tile.x - gameState.cam.x;
    const y = tile.y - gameState.cam.y;

    ctx.fillStyle = getTileColor(tile.type);
    ctx.fillRect(x, y, tile.width, tile.height);

    // Draw subtle grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, tile.width, tile.height);
  }
}

function getTileColor(terrainType) {
  const colors = {
    grass: '#4a9d6f',    // Emerald green
    forest: '#1a5a2a',
    water: '#1a5a9a',
    sand: '#c9a961',
    rock: '#6a6a6a',
    dirt: '#8b7355'
  };
  return colors[terrainType] || '#4a9d6f';
}

function drawEntity(ctx, gameState, entity, className) {
  const x = entity.x - gameState.cam.x;
  const y = entity.y - gameState.cam.y;
  const r = entity.r || 16;

  // Clipping: don't render if far off-screen
  const canvas = ctx.canvas;
  if (x < -r - 50 || x > canvas.width + r + 50 ||
      y < -r - 50 || y > canvas.height + r + 50) {
    return;
  }

  // Determine sprite name
  let spriteName = entity.type === 'player' ? className : entity.type;

  // Try to use sprite, fallback to shape
  if (hasSprite(spriteName)) {
    const sprite = getSprite(spriteName);
    if (sprite) {
      try {
        ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
      } catch (err) {
        // Fallback if image draw fails
        drawFallbackShape(ctx, spriteName, x, y, r);
      }
    }
  } else {
    drawFallbackShape(ctx, spriteName, x, y, r);
  }

  // Draw HP bar above entity (if it's a mob or player)
  if (entity.hp !== undefined && entity.maxHp !== undefined && entity.maxHp > 0) {
    drawHPBar(ctx, x, y - r - 10, r * 2, 4, entity.hp, entity.maxHp);
  }

  // Draw name label (for players)
  if (entity.name && (entity.type === 'player' || entity.class)) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ctx.fillText(entity.name, x, y + r + 12);
    ctx.shadowColor = 'transparent';
  }
}

function drawFallbackShape(ctx, name, x, y, size) {
  const shape = FALLBACK_SHAPES[name] || FALLBACK_SHAPES.player;
  if (!shape) return;

  ctx.fillStyle = shape.color || '#0088ff';
  ctx.globalAlpha = 0.9;

  switch (shape.type) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      break;

    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x - size, y + size);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      break;

    case 'rect':
      ctx.fillRect(x - shape.width / 2, y - shape.height / 2, shape.width, shape.height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - shape.width / 2, y - shape.height / 2, shape.width, shape.height);
      break;

    case 'square':
      const halfSize = size / 2;
      ctx.fillRect(x - halfSize, y - halfSize, size, size);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - halfSize, y - halfSize, size, size);
      break;
  }

  ctx.globalAlpha = 1;
}

function drawHPBar(ctx, x, y, width, height, hp, maxHp) {
  const hpPercent = Math.max(0, Math.min(1, hp / maxHp));

  // Background (dark)
  ctx.fillStyle = '#333333';
  ctx.fillRect(x - width / 2, y, width, height);

  // HP bar (green -> yellow -> red)
  let color = '#00ff00';
  if (hpPercent <= 0.5) color = '#ffff00';
  if (hpPercent <= 0.25) color = '#ff0000';
  
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
    if (elapsed > MAX_DAMAGE_DURATION) continue;

    const progress = elapsed / MAX_DAMAGE_DURATION;
    const opacity = 1 - progress;
    const offsetY = progress * 30;

    const x = dmg.x - gameState.cam.x;
    const y = dmg.y - gameState.cam.y - offsetY;

    ctx.globalAlpha = opacity;
    ctx.fillStyle = dmg.isCrit ? '#ffff00' : '#ff0000';
    ctx.font = `bold ${dmg.isCrit ? 18 : 14}px system-ui`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 3;
    ctx.fillText(dmg.damage, x, y);
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = 1;

    stillActive.push(dmg);
  }

  damageNumbers.length = 0;
  damageNumbers.push(...stillActive);
}

function drawHUD(ctx, gameState, width, height) {
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px system-ui';
  ctx.textBaseline = 'top';

  // Semi-transparent background for text
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(5, 5, 200, 120);

  // Player stats
  ctx.fillStyle = '#ffffff';
  const y = 15;
  ctx.fillText(`${gameState.player.name} Lv.${gameState.player.level}`, 10, y);
  ctx.fillText(`HP: ${gameState.player.hp}/${gameState.player.maxHp}`, 10, y + 20);
  ctx.fillText(`MP: ${gameState.player.mp}/${gameState.player.maxMp}`, 10, y + 35);
  ctx.fillText(`Gold: ${gameState.player.gold}`, 10, y + 50);
  ctx.fillText(`Pos: ${Math.round(gameState.player.x)}, ${Math.round(gameState.player.y)}`, 10, y + 65);

  // Controls hint
  ctx.font = '11px system-ui';
  ctx.fillStyle = '#aaff00';
  const ctrlY = height - 35;
  ctx.fillText('WASD/Arrows: Move | Space: Attack', 10, ctrlY);
  ctx.fillText('I: Inventory | E: Equipment | Q: Quest Log', 10, ctrlY + 15);
}
