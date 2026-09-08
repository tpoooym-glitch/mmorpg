/**
 * Server-Side Inventory System
 * - Server เป็นแหล่งข้อมูลอันดับ 1
 * - Client มี cache เพื่อความเรียบ
 * - Delta updates ส่งการเปลี่ยนแปลงเท่านั้น
 */

const playerInventories = new Map(); // { playerId -> { items: [...], gold, equipment: {...} } }

export function initInventory(playerId, initialGold = 100) {
  playerInventories.set(playerId, {
    gold: initialGold,
    items: [],
    equipment: {
      weapon: null,
      armor: null,
      accessory: null
    }
  });
}

/**
 * เพิ่ม item ไปยัง inventory
 */
export function addItem(playerId, itemId, quantity = 1) {
  const inv = playerInventories.get(playerId);
  if (!inv) throw new Error('Player inventory not found');

  const existingItem = inv.items.find(i => i.id === itemId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    inv.items.push({ id: itemId, quantity });
  }

  return { items: inv.items, delta: { type: 'item_added', itemId, quantity } };
}

/**
 * ลบ item จาก inventory
 */
export function removeItem(playerId, itemId, quantity = 1) {
  const inv = playerInventories.get(playerId);
  if (!inv) throw new Error('Player inventory not found');

  const item = inv.items.find(i => i.id === itemId);
  if (!item || item.quantity < quantity) {
    throw new Error('Not enough items');
  }

  item.quantity -= quantity;
  if (item.quantity === 0) {
    inv.items = inv.items.filter(i => i.id !== itemId);
  }

  return { items: inv.items, delta: { type: 'item_removed', itemId, quantity } };
}

/**
 * เพิ่ม/ลด gold
 */
export function addGold(playerId, amount) {
  const inv = playerInventories.get(playerId);
  if (!inv) throw new Error('Player inventory not found');

  inv.gold = Math.max(0, inv.gold + amount);
  return { gold: inv.gold, delta: { type: 'gold_changed', amount } };
}

export function hasEnoughGold(playerId, amount) {
  const inv = playerInventories.get(playerId);
  return inv && inv.gold >= amount;
}

/**
 * ใส่/ถอด equipment
 */
export function equipItem(playerId, itemId, slot) {
  const inv = playerInventories.get(playerId);
  if (!inv) throw new Error('Player inventory not found');

  const validSlots = ['weapon', 'armor', 'accessory'];
  if (!validSlots.includes(slot)) throw new Error('Invalid equipment slot');

  // Find item in inventory
  const item = inv.items.find(i => i.id === itemId);
  if (!item) throw new Error('Item not in inventory');

  // Swap with previous equipment
  const oldEquip = inv.equipment[slot];
  inv.equipment[slot] = itemId;

  return { equipment: inv.equipment, delta: { type: 'item_equipped', itemId, slot, oldEquip } };
}

export function getInventory(playerId) {
  return playerInventories.get(playerId) || null;
}

export function getInventoryDelta(playerId, lastVersion) {
  // TODO: Implement versioning for delta updates
  return getInventory(playerId);
}
