/**
 * Server-Side Quest System
 * - Quest data มาจาก data/quests.json
 * - Quest progress เก็บฝั่ง server
 * - Validates quest completion
 * - Awards XP + Gold + Items
 */

const playerQuests = new Map(); // { playerId -> { [questId]: { progress, completed, rewarded } } }

export function initPlayerQuests(playerId) {
  playerQuests.set(playerId, {});
}

/**
 * ผู้เล่นรับเควส
 */
export function acceptQuest(playerId, questId, questData) {
  if (!questData) throw new Error('Quest not found');

  const quests = playerQuests.get(playerId) || {};
  if (quests[questId] && quests[questId].completed) {
    throw new Error('Quest already completed');
  }

  if (!quests[questId]) {
    quests[questId] = {
      id: questId,
      name: questData.name,
      progress: 0,
      target: questData.target || 0,
      completed: false,
      rewarded: false,
      acceptedAt: Date.now()
    };
  }

  playerQuests.set(playerId, quests);
  return quests[questId];
}

/**
 * ผู้เล่นฆ่า monster -> ลด kill count
 */
export function onKillMonster(playerId, monsterType) {
  const quests = playerQuests.get(playerId) || {};

  for (const [questId, quest] of Object.entries(quests)) {
    if (!quest.completed && quest.progress < quest.target) {
      // If quest requires killing this monster type, increment progress
      if (questId.includes(monsterType)) {
        quest.progress++;

        // Mark as completed
        if (quest.progress >= quest.target) {
          quest.completed = true;
        }
      }
    }
  }

  playerQuests.set(playerId, quests);
  return quests;
}

/**
 * ผู้เล่นรับรางวัล
 */
export function rewardQuest(playerId, questId, questData) {
  const quests = playerQuests.get(playerId) || {};
  const quest = quests[questId];

  if (!quest || !quest.completed || quest.rewarded) {
    throw new Error('Quest not available for reward');
  }

  const reward = {
    xp: questData.xp || 0,
    gold: questData.gold || 0,
    items: questData.items || []
  };

  quest.rewarded = true;
  playerQuests.set(playerId, quests);

  return reward;
}

export function getPlayerQuests(playerId) {
  return playerQuests.get(playerId) || {};
}

export function getQuestProgress(playerId, questId) {
  const quests = playerQuests.get(playerId) || {};
  return quests[questId] || null;
}
