// 由 tools/build-mp.js 自 src/shared/storage.js 生成，请勿手改
/**
 * src/shared/storage.js —— 本地存储三承诺（读不抛 / 默认值 / 只清自己的键）
 *
 * 大白话：把 localStorage（Web）/ wx.setStorageSync（小程序）包一层：
 *   · 读的时候坏了/不存在 → 返回默认值，绝不抛错；
 *   · 写 1MB 以上的数组直接放弃（防爆仓）；
 *   · 清除时只清 xael_ 前缀的键，不碰别人。
 * 平台适配点在 platform.js，本模块只管策略。
 */

const PREFIX = 'xael_';
const MAX_BYTES = 1024 * 1024;

let driver = null;
let fallback = null; // 内存驱动单例（默认驱动每次调用不能新建，否则写读分离）

/** 注入平台驱动（Web = localStorage；小程序 = wx storage；测试 = 内存 Map） */
function setStorageDriver(d) {
  driver = d;
}

/** 默认驱动：内存 Map 单例（SSR/测试兜底） */
function memoryDriver() {
  if (!fallback) {
    const m = new Map();
    fallback = {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, v),
      removeItem: (k) => m.delete(k),
      keys: () => [...m.keys()],
    };
  }
  return fallback;
}

function drv() {
  return driver || memoryDriver();
}
/** 读（读不抛，损坏返回默认值） */
function get(key, fallback = null) {
  try {
    const raw = drv().getItem(PREFIX + key);
    if (raw == null) return fallback;
    const v = JSON.parse(raw);
    if (v === null || typeof v !== 'object') return v;
    return v;
  } catch {
    return fallback;
  }
}

/** 写（1MB 闸；数组排除——大数组一律拒存） */
function set(key, value) {
  try {
    if (Array.isArray(value) && value.length > 1000) return false;
    const raw = JSON.stringify(value);
    if (raw.length > MAX_BYTES) return false;
    drv().setItem(PREFIX + key, raw);
    return true;
  } catch {
    return false;
  }
}

/** 删 */
function remove(key) {
  try { drv().removeItem(PREFIX + key); } catch { /* 读不抛之写也不抛 */ }
}

/** 清除本工具全部键（只清 xael_ 前缀） */
function clearAll() {
  try {
    for (const k of drv().keys()) {
      if (typeof k === 'string' && k.startsWith(PREFIX)) drv().removeItem(k);
    }
  } catch { /* 不抛 */ }
}

const storage = { get, set, remove, clearAll, setStorageDriver };


module.exports.setStorageDriver = setStorageDriver;
module.exports.get = get;
module.exports.set = set;
module.exports.remove = remove;
module.exports.clearAll = clearAll;
module.exports.storage = storage;
