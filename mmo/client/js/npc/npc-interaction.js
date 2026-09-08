/**
 * NPC Interaction System
 * - Detect nearby NPCs
 * - Handle quest/shop dialogs
 * - Send interaction requests to server
 */

import { sendInteract } from '../multiplayer/multiplayer-client.js';
import { on, emit } from '../core/event-bus.js';

const NPCData = {
  yasara: {
    id: 'yasara',
    name: 'Yasara',
    type: 'shopkeeper',
    x: 800,
    y: 400,
    r: 25,
    dialog: 'Welcome to my shop! Would you like to buy or sell?',
    shop: 'yasara'
  },
  gornak: {
    id: 'gornak',
    name: 'Gornak',
    type: 'blacksmith',
    x: 1000,
    y: 400,
    r: 25,
    dialog: 'I craft the finest weapons and armor in the realm!',
    shop: 'blacksmith'
  },
  elder: {
    id: 'elder',
    name: 'Elder Thallia',
    type: 'quest-giver',
    x: 900,
    y: 600,
    r: 25,
    dialog: 'Monsters plague our lands. Will you help us?',
    quests: ['kill-goblins', 'clear-forest']
  }
};

const INTERACTION_RANGE = 100; // pixels

export function initNPCSystem() {
  on('npc_interaction_response', handleInteractionResponse);
  console.log('[NPC] Initialized with', Object.keys(NPCData).length, 'NPCs');
}

/**
 * ค้นหา NPC ที่อยู่ใกล้กับผู้เล่น
 */
export function getNearbyNPCs(playerX, playerY) {
  return Object.values(NPCData).filter(npc => {
    const distance = Math.hypot(npc.x - playerX, npc.y - playerY);
    return distance <= INTERACTION_RANGE;
  });
}

/**
 * โต้ตอบกับ NPC
 */
export function interactWithNPC(npcId) {
  const npc = NPCData[npcId];
  if (!npc) {
    console.error('[NPC] NPC not found:', npcId);
    return;
  }

  console.log('[NPC] Interacting with', npc.name);

  // ส่งไปยัง server
  sendInteract(npcId);

  // แสดง dialog ทันที
  emit('npc_dialog', {
    npcId: npc.id,
    npcName: npc.name,
    dialog: npc.dialog,
    type: npc.type,
    shop: npc.shop,
    quests: npc.quests
  });
}

function handleInteractionResponse(response) {
  // Server ตอบกลับ
  console.log('[NPC] Server response:', response);
}

export function getNPC(npcId) {
  return NPCData[npcId] || null;
}

export function getAllNPCs() {
  return Object.values(NPCData);
}
