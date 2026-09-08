import { GAME_CONFIG } from '../client/js/core/game-config.js';

// ขอบเขตของแผนที่ (ป้องกันผู้เล่นเดินออกนอกแผนที่)
const WORLD_BOUNDS = {
  minX: 0,
  maxX: 2200,
  minY: 0,
  maxY: 1400
};

// ความเร็วสูงสุดที่อนุญาต (แบบ pixel/sec)
const MAX_PLAYER_SPEED = 250;

/**
 * Server Authority: ตรวจสอบและให้อำนาจท้องถิ่นตำแหน่งผู้เล่น
 * Client ไม่ได้เก็บตำแหน่งที่แท้จริง
 * Client เพียงส่งคำสั่ง "ผมต้องการเดินไปทิศนี้"
 * Server จะคำนวณตำแหน่งใหม่และตรวจสอบ
 */

export function validatePlayerPosition(player, deltaTime) {
  if (!player || !player.x || !player.y) {
    throw new Error('Invalid player object');
  }

  // ตรวจสอบว่าอยู่ในขอบเขตแผนที่
  const x = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, player.x));
  const y = Math.max(WORLD_BOUNDS.minY, Math.min(WORLD_BOUNDS.maxY, player.y));

  return { x, y };
}

/**
 * Server คำนวณตำแหน่งใหม่จากคำสั่ง input
 * ไม่ยอมรับตำแหน่งจาก Client โดยตรง
 */
export function movePlayerOnServer(player, inputKeys, deltaTime, classData) {
  if (deltaTime > 0.1) deltaTime = 0.1; // ป้องกัน deltaTime ใหญ่เกินไป

  let vx = 0, vy = 0;

  if (inputKeys.w || inputKeys.arrowup) vy -= 1;
  if (inputKeys.s || inputKeys.arrowdown) vy += 1;
  if (inputKeys.a || inputKeys.arrowleft) vx -= 1;
  if (inputKeys.d || inputKeys.arrowright) vx += 1;

  // ทำให้เป็น unit vector
  const mag = Math.hypot(vx, vy);
  if (mag > 0) {
    vx /= mag;
    vy /= mag;
  }

  // ความเร็วของตัวละครจากชั้น
  const speed = (classData?.stats?.speed ?? 180) * (mag > 0 ? 1 : 0);

  // ตรวจสอบว่าความเร็วไม่เกินขีดจำกัด
  if (speed > MAX_PLAYER_SPEED) {
    const scale = MAX_PLAYER_SPEED / speed;
    vx *= scale;
    vy *= scale;
  }

  player.x += vx * speed * deltaTime;
  player.y += vy * speed * deltaTime;

  // นำไปตรวจสอบขอบเขต
  const validated = validatePlayerPosition(player, deltaTime);
  player.x = validated.x;
  player.y = validated.y;

  return player;
}

/**
 * ตรวจสอบว่า movement ของผู้เล่นเป็นไปได้ทางกายภาพ
 * (ป้องกันการเทลีพอร์ต หรือเดินเร็วเกินไป)
 */
export function isMovementValid(oldPos, newPos, speed, deltaTime) {
  if (!oldPos || !newPos) return false;

  const maxDistance = speed * deltaTime + 50; // buffer 50px
  const actualDistance = Math.hypot(
    newPos.x - oldPos.x,
    newPos.y - oldPos.y
  );

  return actualDistance <= maxDistance;
}

/**
 * ตรวจสอบช่วง combat
 * ผู้เล่นต้องอยู่ห่างจากศัตรูไม่เกิน attackRange
 */
export function isInAttackRange(attacker, target, attackRange = 78) {
  if (!attacker || !target) return false;

  const distance = Math.hypot(
    attacker.x - target.x,
    attacker.y - target.y
  );

  return distance <= attackRange;
}
