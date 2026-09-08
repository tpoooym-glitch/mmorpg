/**
 * Data Loader: Skills
 * โหลด skills.json แล้ว cache ไว้
 */

let skillsCache = null;

export async function loadSkills() {
  if (skillsCache) return skillsCache;

  try {
    const response = await fetch('../../../data/skills.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    skillsCache = await response.json();
    console.log('[DATA] Skills loaded:', Object.keys(skillsCache).length, 'skills');
    return skillsCache;
  } catch (err) {
    console.error('[DATA] Failed to load skills:', err);
    return {};
  }
}

export function getSkill(skillId) {
  return skillsCache?.[skillId] || null;
}

export function getSkillsByClass(className) {
  // Load from classes.json mapping
  const classSkillMap = {
    warrior: ['slash', 'guard'],
    mage: ['fireball', 'heal'],
    rogue: ['quick-strike', 'evade']
  };

  const skillIds = classSkillMap[className] || [];
  return skillIds.map(id => ({ id, ...skillsCache?.[id] })).filter(s => s.name);
}
