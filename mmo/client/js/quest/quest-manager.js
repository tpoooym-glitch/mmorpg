/**
 * Client-Side Quest Manager
 * - Track active quests
 * - Display progress
 * - Handle quest completion
 */

import { on, emit } from '../core/event-bus.js';

const quests = new Map(); // { questId -> questData }

export function initQuestManager() {
  on('quest_received', handleQuestReceived);
  on('quest_progress', handleQuestProgress);
  on('quest_completed', handleQuestCompleted);
  console.log('[QUEST] Initialized');
}

function handleQuestReceived(data) {
  const quest = {
    id: data.questId,
    name: data.name,
    description: data.description,
    target: data.target,
    progress: 0,
    completed: false,
    rewards: data.rewards
  };
  quests.set(data.questId, quest);
  emit('quests_updated', getActiveQuests());
}

function handleQuestProgress(data) {
  const quest = quests.get(data.questId);
  if (quest) {
    quest.progress = data.progress;
    if (quest.progress >= quest.target) {
      quest.completed = true;
    }
    emit('quests_updated', getActiveQuests());
  }
}

function handleQuestCompleted(data) {
  const quest = quests.get(data.questId);
  if (quest) {
    quest.completed = true;
    quest.rewarded = true;
    emit('quest_reward', {
      questId: data.questId,
      xp: data.rewards?.xp || 0,
      gold: data.rewards?.gold || 0,
      items: data.rewards?.items || []
    });
    emit('quests_updated', getActiveQuests());
  }
}

export function getActiveQuests() {
  return Array.from(quests.values()).filter(q => !q.completed);
}

export function getCompletedQuests() {
  return Array.from(quests.values()).filter(q => q.completed);
}

export function getQuestProgress(questId) {
  return quests.get(questId) || null;
}
