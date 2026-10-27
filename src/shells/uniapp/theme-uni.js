/**
 * src/shells/uniapp/theme-uni.js —— uni-app 端主题解析
 *
 * 大白话：settings.js 里存的是「用户选了浅色 / 深色 / 跟随系统」，
 *   shared/theme.js 的 applyTheme 是给浏览器用的（改 <html> 的 class）；
 *   这里换成 uni-app 的说法：只算出「现在到底该是深还是浅」，
 *   由页面把 nt-dark 类挂到根节点上（三端样式同一份）。
 */

import { getTheme, effectiveTheme } from '../../shared/settings.js';

/** 系统当前深浅色（uni.getSystemInfoSync().theme，取不到就按浅色） */
function systemDark() {
  try {
    const info = uni.getSystemInfoSync();
    return info.theme === 'dark';
  } catch (e) {
    return false;
  }
}

/**
 * 返回 'light' | 'dark'
 * @param {string} [mode] system | light | dark；不传则读用户偏好
 */
export function resolveTheme(mode) {
  const m = mode || getTheme();
  if (m === 'dark') return 'dark';
  if (m === 'light') return 'light';
  if (m === 'system' && typeof uni !== 'undefined') return systemDark() ? 'dark' : 'light';
  return effectiveTheme();
}

/** 顺带把原生窗口背景也刷一下，避免下拉回弹露白 */
export function applyTheme(mode) {
  const v = resolveTheme(mode);
  const dark = v === 'dark';
  try {
    uni.setBackgroundColor({
      backgroundColor: dark ? '#000000' : '#ffffff',
      backgroundColorTop: dark ? '#000000' : '#ffffff',
      backgroundColorBottom: dark ? '#000000' : '#ffffff',
    });
  } catch (e) { /* 某些端不支持，忽略即可 */ }
  return v;
}

export { getTheme };
