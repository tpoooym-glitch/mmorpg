/**
 * Server-Side Combat System
 * - Authoritative damage calculation
 * - Validates attack eligibility (range, cooldown, MP cost)
 * - Prevents cheating (damage modification, teleport attacks, etc.)
 */

import { skillData } from '../data/skills-loader.js';
import { classData } from '../data/classes-loader.js';

const ATTACK_COOLDOWN = 700; // milliseconds
const playerLastAttackTime = new Map(); // { playerId -> timestamp }

export function canPlayerAttack(player) {
  const now = Date.now();
  const lastAttack = playerLastAttackTime.get(player.id) || 0;
  const cooldown = ATTACK_COOLDOWN;

  return (now - lastAttack) >= cooldown;
}

export function recordAttack(playerId) {
  playerLastAttackTime.set(playerId, Date.now());
}

/**
 * Server Authority: คำนวณ damage และตรวจสอบ elegibility
 * ป้องกันการโกงเช่น:
 * - ส่ง damage จาก 25 เป็น 9999
 * - โจมตีจากไกลเกินกว่า attackRange
 * - โจมตีเร็วกว่า cooldown
 */
export function calculateDamage(attacker, target, skillId = null) {
  if (!attacker || !target) throw new Error('Invalid attacker or target');
  if (!target.alive) throw new Error('Target is dead');

  let damage = attacker.attack; // Base attack from class stats
  let mpCost = 0;
  let skillBonus = 0;

  if (skillId) {
    const skill = skillData[skillId];
    if (!skill) throw new Error('Unknown skill');

    mpCost = skill.mpCost || 0;
    if (attacker.mp < mpCost) {
      throw new Error('Not enough MP');
    }

    skillBonus = skill.power || 0;
  }

  // Total damage: attack + skill power - defense + variation
  const totalDamage = damage + skillBonus;
  const reducedDamage = Math.max(1, totalDamage - (target.defense || 0));
  const variance = Math.random() * 10 - 5; // -5 to +5
  const finalDamage = Math.max(1, Math.round(reducedDamage + variance));

  // Critical hit chance (10% for some skills)
  const critChance = skill?.criticalChance || 0;
  const isCrit = Math.random() < critChance;
  const damageOutput = isCrit ? Math.round(finalDamage * 1.5) : finalDamage;

  return {
    damage: damageOutput,
    isCrit,
    mpCost,
    skillUsed: skillId || 'basic-attack'
  };
}

export function applyDamage(target, damage) {
  target.hp = Math.max(0, target.hp - damage);
  if (target.hp === 0) {
    target.alive = false;
    target.state = 'dead';
  }
  return target.hp;
}

export function applyMpCost(player, mpCost) {
  player.mp = Math.max(0, player.mp - mpCost);
  return player.mp;
}

/**
 * ตรวจสอบ attack eligibility
 */
export function validateAttack(attacker, target, distance) {
  const config = {
    attackRange: 78,
    maxDistance: 100 // buffer สำหรับ lag
  };

  if (distance > config.maxDistance) {
    throw new Error('Target out of range');
  }

  if (!canPlayerAttack(attacker)) {
    throw new Error('Attack on cooldown');
  }

  return true;
}
