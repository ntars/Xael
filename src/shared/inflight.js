/**
 * src/shared/inflight.js —— 连点锁 + 忙碌态钩子
 *
 * 大白话：搜索键连点会同时发起多次排盘，结果互相覆盖。
 * 这里给「一次执行」上一把锁：锁期内的重复调用直接拿到 null 被忽略；
 * 无论成功还是抛错，都在 finally 里放锁——绝不把用户永久锁在忙碌态。
 * 页面上配合 .nt-busy（opacity .45，且不响应按压缩放）。
 */

const locks = new Set();

/**
 * 带锁执行。
 * @param {string} key 锁名（如 'search' / 'export'）
 * @param {() => any} fn 任务（可为异步）
 * @returns 任务的返回值；锁被占用时返回 null
 */
export async function withLock(key, fn) {
  if (locks.has(key)) return null;
  locks.add(key);
  try {
    return await fn();
  } finally {
    locks.delete(key);
  }
}

/** 当前是否有人在用这把锁 */
export function isBusy(key) {
  return locks.has(key);
}

/** 测试用：清空所有锁（正常业务不调用） */
export function resetLocks() {
  locks.clear();
}
