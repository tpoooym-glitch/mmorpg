/**
 * Quest Log UI Panel
 * - Display active quests
 * - Show progress
 * - Track rewards
 */

import { emit, on } from '../core/event-bus.js';
import { getActiveQuests, getCompletedQuests } from '../quest/quest-manager.js';

let questLogPanel = null;
let isOpen = false;

export function initQuestLogUI() {
  on('quests_updated', handleQuestsUpdate);
  on('quest_reward', handleQuestReward);
  console.log('[QUEST-LOG] Initialized');
}

/**
 * สลับเปิด/ปิด quest log panel
 */
export function toggleQuestLog() {
  isOpen = !isOpen;
  if (isOpen) {
    openQuestLog();
  } else {
    closeQuestLog();
  }
}

function openQuestLog() {
  const active = getActiveQuests();
  const completed = getCompletedQuests();

  emit('quest_log_opened', {
    active: active,
    completed: completed
  });

  console.log('[QUEST-LOG] Opened');
}

function closeQuestLog() {
  emit('quest_log_closed');
  console.log('[QUEST-LOG] Closed');
}

function handleQuestsUpdate(quests) {
  if (isOpen) {
    emit('quest_log_updated', {
      active: quests.filter(q => !q.completed),
      completed: quests.filter(q => q.completed)
    });
  }
}

function handleQuestReward(reward) {
  console.log('[QUEST-LOG] Reward received:', reward);
  emit('quest_log_updated', {
    active: getActiveQuests(),
    completed: getCompletedQuests()
  });
}

export function isQuestLogOpen() {
  return isOpen;
}
