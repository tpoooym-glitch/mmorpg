/**
 * Client-Side Combat Manager
 * - Send attack requests to server
 * - Display combat feedback
 * - Handle damage numbers
 * - Track combat log
 */

import { sendAttack, sendSkill } from '../multiplayer/multiplayer-client.js';
import { on, emit } from '../core/event-bus.js';

const combatLog = [];
const maxLogEntries = 50;

export function initCombatManager() {
  on('attack_result', handleAttackResult);
  console.log('[COMBAT] Initialized');
}

/**
 * ส่งคำสั่งโจมตีไปยัง server
 */
export function playerAttack(targetId) {
  try {
    sendAttack(targetId);
    logCombat(`Attacking ${targetId}...`);
  } catch (err) {
    console.error('[COMBAT] Attack failed:', err);
    logCombat(`Attack failed: ${err.message}`);
  }
}

/**
 * ส่งคำสั่งใช้สกิลไปยัง server
 */
export function playerUseSkill(skillId, targetId) {
  try {
    sendSkill(skillId, targetId);
    logCombat(`Using skill ${skillId} on ${targetId}...`);
  } catch (err) {
    console.error('[COMBAT] Skill failed:', err);
    logCombat(`Skill failed: ${err.message}`);
  }
}

/**
 * Server ส่งผลการโจมตีกลับมา
 */
function handleAttackResult(result) {
  const attacker = result.attackerId;
  const target = result.targetId;
  const damage = result.damage;
  const isCrit = result.isCrit || false;

  const message = isCrit
    ? `${attacker} CRIT! ${damage} damage to ${target}`
    : `${attacker} dealt ${damage} damage to ${target}`;

  logCombat(message);
  emit('combat_log_updated', getCombatLog());
  emit('damage_number', { targetId: target, damage, isCrit, x: result.x, y: result.y });
}

function logCombat(message) {
  const entry = {
    message,
    timestamp: Date.now()
  };
  combatLog.push(entry);

  // Keep only recent entries
  if (combatLog.length > maxLogEntries) {
    combatLog.shift();
  }

  console.log('[COMBAT]', message);
}

export function getCombatLog() {
  return [...combatLog];
}

export function clearCombatLog() {
  combatLog.length = 0;
}
