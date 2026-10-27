/**
 * src/shared/conversation.js —— 会话态（刷新恢复）
 *
 * 大白话：结果页是搜索的唯一出口，用户刷新后要能看到上一次的排盘结果。
 * 这里把「当前会话」（输入 + 结果）持久化到 storage，页面加载时恢复。
 * 约定：只存轻量数据（结构化结果，不存 DOM）；只管理自己的键。
 */

import { storage } from './storage.js';

const KEY = 'conversation';
const SCHEMA = 'xael/conversation@1';

/** 保存当前会话 */
export function saveConversation(conv) {
  return storage.set(KEY, { schema: SCHEMA, at: Date.now(), ...conv });
}

/** 恢复会话（无/损坏 → null，读不抛） */
export function loadConversation() {
  const c = storage.get(KEY, null);
  if (!c || c.schema !== SCHEMA) return null;
  return c;
}

/** 清空会话 */
export function clearConversation() {
  storage.remove(KEY);
}
