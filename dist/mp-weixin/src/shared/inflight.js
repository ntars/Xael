// 由 tools/build-mp.js 自 src/shared/inflight.js 生成，请勿手改
/**
 * src/shared/inflight.js —— 连点锁（防重复提交）
 *
 * 大白话：搜索按钮连点会同时发起多次排盘，结果互相覆盖。
 * 这里给「一次执行」上一把锁：锁期内再点直接忽略；执行结束（含抛错）自动释放。
 * 同时提供 busy 样式钩子（.nt-busy opacity .45）。
 */

const locks = new Set();

/**
 * 带锁执行：锁期内重复调用返回 null。
 * @param {String} key 锁名
 * @param {Function} fn 异步任务
 */
async function run(key, fn) {
  if (locks.has(key)) return null;
  locks.add(key);
  try {
    return await fn();
  } finally {
    locks.delete(key);
  }
}

/** 当前是否锁定 */
function isBusy(key) {
  return locks.has(key);
}


module.exports.run = run;
module.exports.isBusy = isBusy;
