/**
 * Updated Main Entry Point
 * - ใช้ multiplayer client
 * - เตรียม UI managers
 * - Load data + assets
 * - Game loop
 */

import { state } from './core/state.js';
import { createInput } from './input/input-manager.js';
import { loadZone } from './world/map-loader.js';
import { generateDecor } from './world/decor-generator.js';
import { createMobs } from './entities/mob-factory.js';
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
  console.log('[GAME] Initializing...');

  // Wait for assets
  await ready;

  // Load zone + mobs + decor
  const loaded = await loadZone();
  state.zone = loaded.zone;
  state.error = loaded.error;
  state.player.x = state.zone.spawn.x;
  state.player.y = state.zone.spawn.y;
  state.decor = generateDecor(state.zone);
  state.mobs = createMobs(state.zone);

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

  // Connect to server
  try {
    await connect('Adventurer', 'Warrior');
    gameRunning = true;
    console.log('[GAME] Connected to server, starting game loop');
  } catch (err) {
    console.error('[GAME] Connection failed:', err);
    state.error = 'Failed to connect to server: ' + err.message;
    // Game can still run in single-player mode
    gameRunning = true;
  }

  // Start game loop
  requestAnimationFrame(loop);
}

// ==================== Game Loop ====================
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;

  if (gameRunning) {
    // Update player movement
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
  console.log('[GAME] Attack pressed');
  // TODO: Find nearest enemy and attack
});

on('multiplayer_error', (err) => {
  state.error = 'Connection error: ' + err.message;
  console.error('[GAME]', err);
});

on('multiplayer_disconnected', () => {
  state.error = 'Disconnected from server';
  console.warn('[GAME] Disconnected');
});

// ==================== Start ====================
start().catch(err => {
  console.error('[GAME] Fatal error:', err);
  state.error = 'Fatal error: ' + err.message;
});
