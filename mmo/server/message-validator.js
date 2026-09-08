/**
 * Validate and sanitize messages from clients
 * ป้องกัน malformed data และ injection attacks
 */

const MAX_MESSAGE_LENGTH = 120;
const MAX_PLAYER_NAME_LENGTH = 32;
const VALID_MESSAGE_TYPES = ['move', 'attack', 'skill', 'chat', 'interact'];
const VALID_CLASSES = ['warrior', 'mage', 'rogue'];

export function validateMoveMessage(msg) {
  if (!msg || typeof msg !== 'object') {
    throw new Error('Invalid message format');
  }

  // Server จะคำนวณตำแหน่งเอง ไม่ยอมรับจาก client
  // Client ส่งแค่ input keys
  if (!msg.keys || typeof msg.keys !== 'object') {
    throw new Error('Missing keys object');
  }

  // ตรวจสอบ keys
  const allowedKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
  for (const key in msg.keys) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`Invalid key: ${key}`);
    }
  }

  return {
    type: 'move',
    keys: msg.keys,
    timestamp: Date.now()
  };
}

export function validateAttackMessage(msg) {
  if (!msg || typeof msg !== 'object') {
    throw new Error('Invalid message format');
  }

  // Server จะ validate ช่วง attack เอง
  if (msg.targetId && typeof msg.targetId !== 'string') {
    throw new Error('Invalid targetId');
  }

  return {
    type: 'attack',
    targetId: msg.targetId || null,
    timestamp: Date.now()
  };
}

export function validateSkillMessage(msg) {
  if (!msg || typeof msg !== 'object') {
    throw new Error('Invalid message format');
  }

  if (!msg.skillId || typeof msg.skillId !== 'string') {
    throw new Error('Missing or invalid skillId');
  }

  if (msg.targetId && typeof msg.targetId !== 'string') {
    throw new Error('Invalid targetId');
  }

  return {
    type: 'skill',
    skillId: msg.skillId.substring(0, 50),
    targetId: msg.targetId || null,
    timestamp: Date.now()
  };
}

export function validateChatMessage(msg) {
  if (!msg || typeof msg !== 'object') {
    throw new Error('Invalid message format');
  }

  if (!msg.text || typeof msg.text !== 'string') {
    throw new Error('Missing or invalid message text');
  }

  const text = msg.text.trim().substring(0, MAX_MESSAGE_LENGTH);
  if (text.length === 0) {
    throw new Error('Message is empty');
  }

  // Sanitize: ลบ HTML tags (basic)
  const sanitized = text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return {
    type: 'chat',
    text: sanitized,
    timestamp: Date.now()
  };
}

export function validateInteractionMessage(msg) {
  if (!msg || typeof msg !== 'object') {
    throw new Error('Invalid message format');
  }

  if (!msg.targetId || typeof msg.targetId !== 'string') {
    throw new Error('Missing or invalid targetId');
  }

  return {
    type: 'interact',
    targetId: msg.targetId,
    timestamp: Date.now()
  };
}

export function validateJoinMessage(msg) {
  if (!msg || typeof msg !== 'object') {
    throw new Error('Invalid message format');
  }

  if (!msg.playerName || typeof msg.playerName !== 'string') {
    throw new Error('Missing or invalid playerName');
  }

  if (!msg.playerClass || typeof msg.playerClass !== 'string') {
    throw new Error('Missing or invalid playerClass');
  }

  const name = msg.playerName.trim().substring(0, MAX_PLAYER_NAME_LENGTH);
  const cls = msg.playerClass.toLowerCase();

  if (name.length === 0) {
    throw new Error('Player name cannot be empty');
  }

  if (!VALID_CLASSES.includes(cls)) {
    throw new Error('Invalid player class');
  }

  return {
    playerName: name,
    playerClass: cls
  };
}
