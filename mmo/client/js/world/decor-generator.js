/**
 * Decor Generator: สร้างต้นไม้ หินต่างๆ ในแผนที่
 * - ใช้ asset ที่มีจริง (oak-large, pine-large, rock-large)
 * - สร้างตำแหน่งแบบ procedural จากเมล็ด
 */

export function generateDecor(zone) {
  if (!zone) return [];

  const decor = [];
  const { width = 2200, height = 1400 } = zone;

  // ========== Trees ==========
  // Oak trees: บริเวณตะวันตก
  for (let i = 0; i < 15; i++) {
    decor.push({
      type: 'oak-large',
      x: 100 + Math.random() * 400,
      y: 200 + Math.random() * 600,
      r: 25
    });
  }

  // Pine trees: บริเวณตะวันออก
  for (let i = 0; i < 12; i++) {
    decor.push({
      type: 'pine-large',
      x: 1600 + Math.random() * 400,
      y: 200 + Math.random() * 600,
      r: 20
    });
  }

  // ========== Rocks ==========
  for (let i = 0; i < 20; i++) {
    decor.push({
      type: 'rock-large',
      x: 200 + Math.random() * 1800,
      y: 800 + Math.random() * 500,
      r: 12
    });
  }

  return decor;
}
