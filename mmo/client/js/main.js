/**
 * Updated Main Entry Point
 * - Simple grass field (no mobs/buildings yet)
 * - Focus on exploration and movement
 * - Multiplayer ready
 */

import { state } from './core/state.js';
import { createInput } from './input/input-manager.js';
import { loadZone } from './world/map-loader.js';
import { generateDecor } from './world/decor-generator.js';
import { move } from './systems/movement-system.js';
import { loadAssets } from './render/asset-loader.js';
import { drawScene } from './render/canvas-renderer.js';
import { updateHud } from './ui/hud.js';
import { emit, on } from './core/event-bus.js';

// Multiplayer
import { connect, sendMove, interpolateRemotePlayers } from './multiplayer/multiplayer-client.js';

// Managers
import { initInventory } from './inventory/inventory-manager.js';
import { initEquipment } from './equipment/equipment-manager.js';
import { initQuestManager } from './quest/quest-manager.js';
import { initCombatManager } from './combat/combat-manager.js';
import { initNPCSystem } from './npc/npc-interaction.js';

// UI
import { initInventoryUI, toggleInventory } from './ui/inventory-panel.js';
import { initEquipmentUI, toggleEquipment } from './ui/equipment-panel.js';
import { initQuestLogUI, toggleQuestLog } from './ui/quest-log.js';
import { initShopUI } from './shop/shop-ui.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const input = createInput(() => {
  // Attack button handler
  emit('player_attack');
});

let { assets, ready } = loadAssets();
let last = performance.now();
let gameRunning = false;

// ==================== Setup ====================
async function start() {
  console.log('[GAME] Initializing Arelia Online...');
  console.log('[GAME] Loading assets...');

  // Wait for assets
  await ready;
  console.log('[GAME] Assets ready');

  // Load zone (grass field)
  const loaded = await loadZone();
  state.zone = loaded.zone;
  state.error = loaded.error;
  
  if (!state.zone) {
    console.error('[GAME] Failed to load zone');
    state.error = 'Failed to load zone';
    return;
  }

  state.player.x = state.zone.spawn.x;
  state.player.y = state.zone.spawn.y;
  state.decor = generateDecor(state.zone);
  state.mobs = []; // No mobs for now

  console.log(`[GAME] Zone loaded: ${state.zone.name}`);
  console.log(`[GAME] Decor: ${state.decor.length} objects`);
  console.log(`[GAME] Spawn: (${state.player.x}, ${state.player.y})`);

  // Initialize managers
  initInventory();
  initEquipment();
  initQuestManager();
  initCombatManager();
  initNPCSystem();
  initInventoryUI();
  initEquipmentUI();
  initQuestLogUI();
  initShopUI();

  // Try to connect to server (optional for now)
  try {
    console.log('[GAME] Connecting to server...');
    await connect('Adventurer', 'Warrior');
    gameRunning = true;
    console.log('[GAME] Connected! Starting multiplayer game');
  } catch (err) {
    console.warn('[GAME] Server connection failed, running in single-player mode');
    console.warn('[GAME]', err.message);
    gameRunning = true; // Still run game in single-player
  }

  // Start game loop
  requestAnimationFrame(loop);
}

// ==================== Game Loop ====================
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;

  if (gameRunning) {
    // Update player movement (server-side simulated)
    move(state, input.keys, dt);

    // Send input to server
    sendMove(input.keys);

    // Interpolate remote players
    interpolateRemotePlayers();

    // Render
    drawScene(ctx, state, assets);
    updateHud(state);
  }

  requestAnimationFrame(loop);
}

// ==================== Input Handling ====================
document.addEventListener('keydown', (e) => {
  // I: Inventory
  if (e.key === 'i' || e.key === 'I') {
    toggleInventory();
  }
  // E: Equipment
  if (e.key === 'e' || e.key === 'E') {
    toggleEquipment();
  }
  // Q: Quest Log
  if (e.key === 'q' || e.key === 'Q') {
    toggleQuestLog();
  }
});

// ==================== Event Handlers ====================
on('player_attack', () => {
  console.log('[GAME] Attack pressed (no targets yet)');
});

on('multiplayer_error', (err) => {
  state.error = 'Connection error: ' + err.message;
  console.error('[GAME]', err);
});

on('multiplayer_disconnected', () => {
  console.warn('[GAME] Server disconnected - continuing in single-player');
});

// ==================== Start ====================
console.log('🎮 Arelia Online - Starting game...');
start().catch(err => {
  console.error('[GAME] Fatal error:', err);
  state.error = 'Fatal error: ' + err.message;
});
