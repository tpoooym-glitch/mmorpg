/**
 * Inventory UI Panel
 * - Display items
 * - Show equipment
 * - Display gold
 */

import { emit, on } from '../core/event-bus.js';
import { getInventory, getItemQuantity } from '../inventory/inventory-manager.js';
import { getEquipment } from '../equipment/equipment-manager.js';

let inventoryPanel = null;
let isOpen = false;

export function initInventoryUI() {
  on('inventory_updated', handleInventoryUpdate);
  on('stats_changed', handleStatsUpdate);
  console.log('[INVENTORY-UI] Initialized');
}

/**
 * สลับเปิด/ปิด inventory panel
 */
export function toggleInventory() {
  isOpen = !isOpen;
  if (isOpen) {
    openInventory();
  } else {
    closeInventory();
  }
}

function openInventory() {
  const inv = getInventory();
  const equip = getEquipment();

  emit('inventory_panel_opened', {
    gold: inv.gold,
    items: inv.items,
    equipment: equip
  });

  console.log('[INVENTORY-UI] Opened');
}

function closeInventory() {
  emit('inventory_panel_closed');
  console.log('[INVENTORY-UI] Closed');
}

function handleInventoryUpdate(inv) {
  if (isOpen) {
    emit('inventory_panel_updated', {
      gold: inv.gold,
      items: inv.items,
      equipment: inv.equipment
    });
  }
}

function handleStatsUpdate(stats) {
  if (isOpen) {
    emit('stats_panel_updated', stats);
  }
}

export function useItem(itemId) {
  const qty = getItemQuantity(itemId);
  if (qty <= 0) {
    console.error('[INVENTORY-UI] Item not found');
    return;
  }

  console.log('[INVENTORY-UI] Using item:', itemId);
  emit('item_used', { itemId });
}

export function isInventoryOpen() {
  return isOpen;
}
