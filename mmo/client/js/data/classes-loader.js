/**
 * Data Loader: Classes
 * โหลด classes.json แล้ว cache ไว้
 */

let classesCache = null;

export async function loadClasses() {
  if (classesCache) return classesCache;

  try {
    const response = await fetch('../../../data/classes.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    classesCache = await response.json();
    console.log('[DATA] Classes loaded:', Object.keys(classesCache).length, 'classes');
    return classesCache;
  } catch (err) {
    console.error('[DATA] Failed to load classes:', err);
    return {};
  }
}

export function getClass(className) {
  return classesCache?.[className] || null;
}

export function getAllClasses() {
  return Object.entries(classesCache || {}).map(([id, data]) => ({
    id,
    ...data
  }));
}
