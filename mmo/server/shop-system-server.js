/**
 * Server-Side Shop System
 * - Shop data มาจาก data/shops.json
 * - Server validates gold + inventory space
 * - Server ตัดหลักในการจำหน่าย
 */

import { inventorySystem } from './inventory-system-server.js';

const SHOP_DATA = {
  yasara: {
    name: 'Yasara',
    description: 'General merchant',
    items: ['potion-small', 'ether-small', 'iron-sword', 'leather-armor']
  },
  blacksmith: {
    name: 'Gornak',
    description: 'Weapons & Armor',
    items: ['iron-sword', 'steel-sword', 'leather-armor', 'iron-armor']
  }
};

/**
 * ผู้เล่นซื้อของจากร้าน
 * Server ตรวจสอบ:
 * 1. ร้านมีของนี้ไหม
 * 2. ผู้เล่นมี gold พอไหม
 * 3. Inventory space
 */
export function buyItem(playerId, shopId, itemId, itemData) {
  const shop = SHOP_DATA[shopId];
  if (!shop) throw new Error('Shop not found');

  if (!shop.items.includes(itemId)) {
    throw new Error('Shop does not sell this item');
  }

  if (!itemData) throw new Error('Item data not found');

  const price = itemData.buyPrice || 0;

  // ตรวจสอบ gold
  if (!inventorySystem.hasEnoughGold(playerId, price)) {
    throw new Error('Not enough gold');
  }

  // ตัดเงิน
  inventorySystem.addGold(playerId, -price);

  // เพิ่มของ
  inventorySystem.addItem(playerId, itemId, 1);

  return {
    success: true,
    itemId,
    price,
    newGold: inventorySystem.getInventory(playerId).gold
  };
}

/**
 * ผู้เล่นขายของให้ร้าน
 */
export function sellItem(playerId, shopId, itemId, itemData) {
  const shop = SHOP_DATA[shopId];
  if (!shop) throw new Error('Shop not found');

  if (!itemData) throw new Error('Item data not found');

  const sellPrice = itemData.sellPrice || 0;

  // ลบของออก inventory
  inventorySystem.removeItem(playerId, itemId, 1);

  // เพิ่มเงิน
  inventorySystem.addGold(playerId, sellPrice);

  return {
    success: true,
    itemId,
    sellPrice,
    newGold: inventorySystem.getInventory(playerId).gold
  };
}

export function getShop(shopId) {
  return SHOP_DATA[shopId] || null;
}

export function getShopItems(shopId) {
  const shop = SHOP_DATA[shopId];
  return shop ? shop.items : [];
}
