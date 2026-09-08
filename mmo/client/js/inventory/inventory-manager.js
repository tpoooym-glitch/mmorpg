/**
 * Client-Side Inventory Manager
 * - Cache inventory data from server
 * - Handle UI updates
 * - Predict optimistic updates (rollback if server rejects)
 */

import { on, emit } from '../core/event-bus.js';

const inventory = {
  gold: 100,
  items: [],
  equipment: {
    weapon: null,
    armor: null,
    accessory: null
  },
  lastUpdated: Date.now()
};

// ==================== Setup ====================
export function initInventory() {
  on('multiplayer_snapshot', handleServerSnapshot);
  on('inventory_delta', handleDelta);
  console.log('[INVENTORY] Initialized');
}

// ==================== Server Updates ====================
function handleServerSnapshot(snapshot) {
  // Server sends full inventory state when player joins
  if (snapshot.inventory) {
    inventory.gold = snapshot.inventory.gold;
    inventory.items = snapshot.inventory.items;
    inventory.equipment = snapshot.inventory.equipment;
    inventory.lastUpdated = Date.now();
  }
}

function handleDelta(delta) {
  // Server sends delta (incremental) updates
  switch (delta.type) {
    case 'gold_changed':
      inventory.gold = delta.newGold || 0;
      break;
    case 'item_added':
      const existing = inventory.items.find(i => i.id === delta.itemId);
      if (existing) {
        existing.quantity += delta.quantity;
      } else {
        inventory.items.push({ id: delta.itemId, quantity: delta.quantity });
      }
      break;
    case 'item_removed':
      const item = inventory.items.find(i => i.id === delta.itemId);
      if (item) {
        item.quantity -= delta.quantity;
        if (item.quantity <= 0) {
          inventory.items = inventory.items.filter(i => i.id !== delta.itemId);
        }
      }
      break;
    case 'item_equipped':
      inventory.equipment[delta.slot] = delta.itemId;
      break;
  }
  inventory.lastUpdated = Date.now();
  emit('inventory_updated', inventory);
}

// ==================== Getters ====================
export function getInventory() {
  return { ...inventory };
}

export function getGold() {
  return inventory.gold;
}

export function getItems() {
  return [...inventory.items];
}

export function getEquipment() {
  return { ...inventory.equipment };
}

export function hasItem(itemId, quantity = 1) {
  const item = inventory.items.find(i => i.id === itemId);
  return item && item.quantity >= quantity;
}

export function getItemQuantity(itemId) {
  const item = inventory.items.find(i => i.id === itemId);
  return item?.quantity || 0;
}

// ==================== Optimistic Updates ====================
const pendingChanges = new Map(); // { changeId -> { type, data, timestamp } }
let changeCounter = 0;

export function optimisticAddGold(amount) {
  const changeId = `gold_${++changeCounter}`;
  const oldGold = inventory.gold;

  // Optimistic update
  inventory.gold += amount;
  emit('inventory_updated', inventory);

  // Store for rollback if needed
  pendingChanges.set(changeId, {
    type: 'gold',
    data: { amount, oldGold },
    timestamp: Date.now()
  });

  return changeId;
}

export function optimisticAddItem(itemId, quantity = 1) {
  const changeId = `item_${++changeCounter}`;
  const existing = inventory.items.find(i => i.id === itemId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    inventory.items.push({ id: itemId, quantity });
  }

  emit('inventory_updated', inventory);

  pendingChanges.set(changeId, {
    type: 'item_added',
    data: { itemId, quantity },
    timestamp: Date.now()
  });

  return changeId;
}

// Rollback if server rejects
export function rollbackChange(changeId, errorMessage) {
  const change = pendingChanges.get(changeId);
  if (!change) return;

  switch (change.type) {
    case 'gold':
      inventory.gold = change.data.oldGold;
      break;
    // Add more rollback logic as needed
  }

  pendingChanges.delete(changeId);
  emit('inventory_updated', inventory);
  emit('inventory_error', { changeId, error: errorMessage });
}
