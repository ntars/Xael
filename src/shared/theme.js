/**
 * src/shared/theme.js —— 主题的实际应用与主题过渡门控
 *
 * 大白话：settings.js 管「用户选了浅色还是深色」，这里管「怎么把它画到页面上」。
 *   · 浅色/深色各是一组 CSS 变量，切主题只换变量，不重排布局；
 *   · 深色 = 在 <html> 上挂 .nt-dark（CSS 里统一写覆盖值），JS 不再写行内变量，
 *     避免和 theme.css 两份真源打架；
 *   · 切换瞬间给 <html> 挂 .nt-theme-fade 并显式枚举参与过渡的类名，
 *     320ms 后摘掉——用「一次性门控」而不是全局 transition，避免拖慢每一次点击。
 */

import { effectiveTheme } from './settings.js';

/** 动效令牌：数值必须与 theme.css 的 :root 保持一致（测试会校验） */
export const MOTION = {
  easeStandard: 'cubic-bezier(.4,0,.2,1)',
  dPress: 120,
  dDrawer: 280,
  dModalOut: 200,
  dPage: 320,
  dTheme: 320,
  dSplash: 400,
  dHalo: 4400,
};

/**
 * 参与主题过渡的类名白名单。
 * 只写具体类名，不写通配选择器——WXSS 不支持通配，三端共用同一份约定。
 */
export const THEME_FADE_SELECTORS = [
  '.nt-layer', '.nt-dl-card', '.nt-setrow', '.nt-pill', '.nt-pill-btn',
  '.nt-modal', '.nt-toast', '.nt-nav-title', '.nt-nav-about', '.nt-page-h',
  '.nt-hero-title', '.nt-hero-note', '.nt-brand-name', '.nt-brand-sub',
  '.nt-dl-h1', '.nt-dl-text', '.nt-setl-title', '.nt-setl-desc',
  '.nt-modal-title', '.nt-modal-desc', '.nt-setfoot-line', '.nt-pill-input',
  '.nt-ph-item', '.res-block-label', '.nt-icon',
];

/** 把主题落到 DOM（Web 端） */
export function applyTheme(mode) {
  if (typeof document === 'undefined') return 'light';
  const root = document.documentElement;
  const dark = (mode === 'system' ? effectiveTheme() : mode) === 'dark';
  root.classList.toggle('nt-dark', dark);
  // 同步浏览器 UI 色（iOS Safari 状态栏 / Android 地址栏）
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#000000' : '#ffffff');
  return dark ? 'dark' : 'light';
}

let fadeTimer = 0;

/** 带 320ms 交叉淡化的主题切换（同一时刻只挂一次门控类） */
export function applyThemeWithFade(mode) {
  if (typeof document === 'undefined') return 'light';
  const root = document.documentElement;
  root.classList.add('nt-theme-fade');
  const v = applyTheme(mode);
  clearTimeout(fadeTimer);
  fadeTimer = setTimeout(() => root.classList.remove('nt-theme-fade'), MOTION.dTheme);
  return v;
}

/** 跟随系统变化（mode=system 时才生效） */
export function watchSystemTheme(onChange) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    const v = applyTheme('system');
    if (onChange) onChange(v);
  };
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
