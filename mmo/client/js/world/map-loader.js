/**
 * Updated Emerald Vales Map
 * - Grass field terrain ทั่วแผนที่
 * - Spawn point ตรงกลาง
 * - ไม่มี buildings/mobs ในตอนนี้
 */

export async function loadZone() {
  try {
    // ตอนนี้ return hardcoded grass field
    const zone = {
      id: 'emerald-vales',
      name: 'Emerald Vales',
      width: 2200,
      height: 1400,
      spawn: { x: 1100, y: 700 },
      terrain: [
        // Entire map is grass
        {
          type: 'grass',
          x: 0,
          y: 0,
          width: 2200,
          height: 1400
        }
      ],
      collision: [
        // No collision for now - just open field
      ]
    };

    console.log('[MAP] Loaded Emerald Vales (grass field)');
    return { zone, error: null };
  } catch (err) {
    console.error('[MAP] Failed to load zone:', err);
    return { zone: null, error: err.message };
  }
}
