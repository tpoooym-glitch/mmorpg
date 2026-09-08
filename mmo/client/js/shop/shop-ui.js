/**
 * Shop UI Panel
 * - Display items for sale
 * - Handle buy/sell transactions
 * - Update inventory on success
 */

import { emit, on } from '../core/event-bus.js';
import { getInventory } from '../inventory/inventory-manager.js';

let shopPanel = null;
let currentShopId = null;
let shopItems = [];

export function initShopUI() {
  on('npc_dialog', handleNPCDialog);
  on('shop_transaction_result', handleTransactionResult);
  console.log('[SHOP-UI] Initialized');
}

function handleNPCDialog(data) {
  if (data.type === 'shopkeeper' && data.shop) {
    openShop(data.shop, data.npcName);
  }
}

/**
 * เปิด shop UI
 */
export function openShop(shopId, shopName) {
  currentShopId = shopId;
  console.log('[SHOP-UI] Opening shop:', shopName);

  // TODO: โหลด items จาก data/items.json
  shopItems = [
    { id: 'potion-small', name: 'Small Potion', price: 15, type: 'consumable' },
    { id: 'ether-small', name: 'Small Ether', price: 20, type: 'consumable' },
    { id: 'iron-sword', name: 'Iron Sword', price: 100, type: 'weapon' },
    { id: 'leather-armor', name: 'Leather Armor', price: 80, type: 'armor' }
  ];

  emit('shop_opened', { shopId, shopName, items: shopItems });
}

/**
 * ปิด shop UI
 */
export function closeShop() {
  currentShopId = null;
  shopItems = [];
  emit('shop_closed');
}

/**
 * ผู้เล่นกดซื้อของ
 */
export function buyItem(itemId) {
  if (!currentShopId) {
    console.error('[SHOP-UI] No shop open');
    return;
  }

  const item = shopItems.find(i => i.id === itemId);
  if (!item) {
    console.error('[SHOP-UI] Item not found:', itemId);
    return;
  }

  const inv = getInventory();
  if (inv.gold < item.price) {
    emit('shop_error', { message: 'Not enough gold' });
    return;
  }

  console.log('[SHOP-UI] Buying', item.name);
  emit('buy_item', { shopId: currentShopId, itemId, price: item.price });
}

/**
 * ผู้เล่นกดขายของ
 */
export function sellItem(itemId) {
  if (!currentShopId) {
    console.error('[SHOP-UI] No shop open');
    return;
  }

  const item = shopItems.find(i => i.id === itemId);
  if (!item) {
    console.error('[SHOP-UI] Item not found:', itemId);
    return;
  }

  console.log('[SHOP-UI] Selling', item.name);
  emit('sell_item', { shopId: currentShopId, itemId });
}

function handleTransactionResult(result) {
  if (result.success) {
    emit('shop_success', { message: `Transaction successful!` });
  } else {
    emit('shop_error', { message: result.error || 'Transaction failed' });
  }
}

export function getShopItems() {
  return [...shopItems];
}

export function getCurrentShop() {
  return currentShopId;
}
