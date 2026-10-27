// 由 tools/build-mp.js 自 src/shared/theme.js 生成，请勿手改
/**
 * src/shared/theme.js —— 主题（浅/深/跟随系统）
 *
 * 大白话：黑白灰极简、无描边无阴影。深色 = html 挂 .nt-dark + 变量翻转。
 * 变量：--nt-paper 页面底 / --nt-elevated 浮层底 / --nt-ink 主字 / --nt-ink-2 次字。
 * 过渡 320ms 交叉淡化（.nt-theme-fade 门控显式枚举类名，无通配选择器——WXSS 兼容）。
 */

const THEME_VARS = {
  light: {
    '--nt-paper': '#ffffff',
    '--nt-elevated': '#f5f5f7',
    '--nt-ink': '#1a1a1a',
    '--nt-ink-2': '#6e6e73',
    '--nt-hairline': 'rgba(0,0,0,0.08)',
  },
  dark: {
    '--nt-paper': '#1a1a1a',
    '--nt-elevated': '#2c2c2e',
    '--nt-ink': '#f5f5f7',
    '--nt-ink-2': '#98989d',
    '--nt-hairline': 'rgba(255,255,255,0.10)',
  },
};

/** 动效令牌（theme.css 单一真源，此处供 JS 动画读取） */
const MOTION = {
  easeStandard: 'cubic-bezier(.4,0,.2,1)',
  dPress: 120, dDrawer: 280, dModalOut: 200, dPage: 320, dTheme: 320, dSplash: 400, dHalo: 4400,
};

/** 应用主题（Web 端：html 挂类 + 写变量） */
function applyTheme(mode) {
  if (typeof document === 'undefined') return mode;
  const dark = mode === 'dark' || (mode === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches);
  const root = document.documentElement;
  root.classList.toggle('nt-dark', dark);
  const vars = dark ? THEME_VARS.dark : THEME_VARS.light;
  for (const k in vars) root.style.setProperty(k, vars[k]);
  return dark ? 'dark' : 'light';
}


module.exports.applyTheme = applyTheme;
module.exports.THEME_VARS = THEME_VARS;
module.exports.MOTION = MOTION;
