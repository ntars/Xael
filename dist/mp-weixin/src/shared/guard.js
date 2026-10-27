// 由 tools/build-mp.js 自 src/shared/guard.js 生成，请勿手改
/**
 * src/shared/guard.js —— 全局错误守卫
 *
 * 大白话：页面顶层兜底——只监听 window error / unhandledrejection 两个口，
 * 把错误记到本地（频控），不吞错、不把堆栈给用户看（用户只见统一提示语）。
 */

const { storage } = require('./storage.js');

const KEY = 'guard';
const LIMIT_MS = 60 * 1000; // 频控：1 分钟最多记 10 条
let lastFlush = 0;
let count = 0;

function installGuard() {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (e) => record(e.message || 'error'));
  window.addEventListener('unhandledrejection', (e) => record(String(e.reason || 'rejection')));
}

function record(msg) {
  const now = Date.now();
  if (now - lastFlush > LIMIT_MS) { count = 0; lastFlush = now; }
  if (++count > 10) return;
  try {
    const list = storage.get(KEY, []);
    list.push({ at: now, msg: String(msg).slice(0, 200) });
    storage.set(KEY, list.slice(-20)); // 只留最近 20 条，不存堆栈
  } catch { /* 守卫自身绝不抛 */ }
}

/** 面向用户的统一提示（不含任何堆栈细节） */
function userMessage() {
  return '出了点小问题，请重试。';
}


module.exports.installGuard = installGuard;
module.exports.userMessage = userMessage;
