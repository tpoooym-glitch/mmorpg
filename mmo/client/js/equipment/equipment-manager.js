/**
 * Client-Side Equipment Manager
 * - Track equipped items
 * - Calculate stat bonuses
 * - Update HUD when equipment changes
 */

import { on, emit } from '../core/event-bus.js';

const equipment = {
  weapon: null,      // { id, name, stats: { attack } }
  armor: null,       // { id, name, stats: { defense } }
  accessory: null    // { id, name, stats: { ... } }
};

let statBonuses = {
  attack: 0,
  defense: 0,
  hp: 0,
  mp: 0
};

export function initEquipment() {
  on('equipment_changed', handleEquipmentChange);
  console.log('[EQUIPMENT] Initialized');
}

function handleEquipmentChange(data) {
  if (data.slot && data.itemData) {
    equipment[data.slot] = data.itemData;
    recalculateBonuses();
    emit('stats_changed', getStatBonuses());
  }
}

function recalculateBonuses() {
  statBonuses = {
    attack: 0,
    defense: 0,
    hp: 0,
    mp: 0
  };

  for (const slot in equipment) {
    const item = equipment[slot];
    if (item?.stats) {
      for (const stat in item.stats) {
        statBonuses[stat] = (statBonuses[stat] || 0) + item.stats[stat];
      }
    }
  }
}

export function getEquipment() {
  return { ...equipment };
}

export function getStatBonuses() {
  return { ...statBonuses };
}

export function equipItem(slot, itemData) {
  equipment[slot] = itemData;
  recalculateBonuses();
  emit('stats_changed', statBonuses);
}

export function unequipItem(slot) {
  equipment[slot] = null;
  recalculateBonuses();
  emit('stats_changed', statBonuses);
}
