/**
 * Equipment UI Panel
 * - Display equipped items
 * - Show stat bonuses
 */

import { emit, on } from '../core/event-bus.js';
import { getEquipment, getStatBonuses } from '../equipment/equipment-manager.js';

let equipmentPanel = null;
let isOpen = false;

export function initEquipmentUI() {
  on('stats_changed', handleStatsUpdate);
  on('equipment_changed', handleEquipmentUpdate);
  console.log('[EQUIPMENT-UI] Initialized');
}

/**
 * สลับเปิด/ปิด equipment panel
 */
export function toggleEquipment() {
  isOpen = !isOpen;
  if (isOpen) {
    openEquipment();
  } else {
    closeEquipment();
  }
}

function openEquipment() {
  const equip = getEquipment();
  const bonuses = getStatBonuses();

  emit('equipment_panel_opened', {
    equipped: equip,
    bonuses: bonuses
  });

  console.log('[EQUIPMENT-UI] Opened');
}

function closeEquipment() {
  emit('equipment_panel_closed');
  console.log('[EQUIPMENT-UI] Closed');
}

function handleStatsUpdate(stats) {
  if (isOpen) {
    emit('equipment_panel_updated', stats);
  }
}

function handleEquipmentUpdate(data) {
  if (isOpen) {
    const equip = getEquipment();
    const bonuses = getStatBonuses();
    emit('equipment_panel_updated', {
      equipped: equip,
      bonuses: bonuses,
      changed: data
    });
  }
}

export function isEquipmentOpen() {
  return isOpen;
}
