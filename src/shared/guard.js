/**
 * src/shared/guard.js —— 全局错误兜底（只记录、不外传、不吞错）
 *
 * 大白话：页面顶层有两个口子会漏错——脚本异常（error）与没被接住的 Promise（unhandledrejection）。
 * 这里只做三件事：
 *   1. 记一条本地日志（限频：1 分钟最多 10 条；只留最近 20 条；不存堆栈，防泄漏路径）；
 *   2. 给用户统一的一句提示，绝不把技术细节抛到脸上；
 *   3. 不拦截、不改写错误本身——控制台里仍然是原来的错，方便排查。
 *
 * 适配：Web 用 window 事件；小程序没有 window，由壳层在 onError 里直接调 record()。
 */

import { storage } from './storage.js';

const KEY = 'guard';
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 10;
const KEEP = 20;

let windowStart = 0;
let count = 0;

/** 记录一条错误（本地，限频） */
export function record(msg, where) {
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    count = 0;
  }
  if (++count > MAX_PER_WINDOW) return;
  try {
    const list = storage.get(KEY, []);
    const arr = Array.isArray(list) ? list : [];
    arr.push({ at: now, where: String(where || '').slice(0, 40), msg: String(msg || '').slice(0, 160) });
    storage.set(KEY, arr.slice(-KEEP));
  } catch (e) {
    /* 守卫自身绝不抛 */
  }
}

/** 安装 Web 端两个监听口（重复调用只装一次） */
let installed = false;
export function installGuard() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (e) => record(e && e.message, 'error'));
  window.addEventListener('unhandledrejection', (e) => {
    const r = e && e.reason;
    record(r && (r.message || r), 'rejection');
  });
}

/** 给用户看的统一提示（不含任何技术细节） */
export function userMessage() {
  return '出了点小问题，请重试。';
}

/** 读本地错误日志（设置页/排查用；无则空数组） */
export function readLog() {
  const list = storage.get(KEY, []);
  return Array.isArray(list) ? list : [];
}
