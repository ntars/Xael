/**
 * static/app.js —— PWA 壳（视图切换 + 搜索 + 结果渲染 + 弹窗）
 *
 * 大白话：这一层只管「页面上怎么显示」，所有计算都调 src/core；
 * 三个形态（PWA/小程序/uni-app）共用同一套核心与同一套文案（settings.js）。
 */

import { analyze } from '../core/features/analyzer.js';
import { buildResultView, blockTitle, isPairRow, flattenRows } from '../shared/result-format.js';
import { SETTINGS } from '../shared/settings.js';
import { REFS, REFS_NOTE } from '../shared/refs.js';
import { storage } from '../shared/storage.js';
import { run as withLock } from '../shared/inflight.js';
import { installGuard, userMessage } from '../shared/guard.js';
import { applyTheme } from '../shared/theme.js';
import { getTheme } from '../shared/settings.js';

const $ = (id) => document.getElementById(id);

/** 视图切换（页面转场 320ms） */
function showView(name) {
  for (const v of ['home', 'about', 'studio', 'doc']) {
    const el = $('view-' + v);
    if (!el) continue;
    const on = v === name;
    el.hidden = !on;
    if (on) {
      el.classList.add('nt-rise');
      el.classList.add('nt-cascade');
      setTimeout(() => el.classList.remove('nt-cascade'), 600);
    }
  }
  window.scrollTo(0, 0);
}

/** 渲染结果页 */
function renderResult(view) {
  const box = $('result');
  if (!view) { box.hidden = true; box.innerHTML = ''; return; }
  const parts = [];
  const renderOne = (r) => {
    parts.push(`<h2 class="nt-result-title">${esc(r.title)}</h2>`);
    if (r.lead) parts.push(`<p class="nt-result-lead">${esc(r.lead)}</p>`);
    for (const b of r.blocks || []) {
      parts.push(`<section class="nt-block"><h3 class="nt-block-title">${esc(blockTitle(b))}</h3>`);
      for (const row of flattenRows(b.数据 || {})) {
        if (row.group) { parts.push(`<div class="nt-row-group">${esc(row.label)}</div>`); continue; }
        parts.push(isPairRow(row.label, row.value)
          ? `<div class="nt-row"><span class="nt-row-label">${esc(row.label)}</span><span class="nt-row-value">${esc(row.value)}</span></div>`
          : `<div class="nt-row nt-row-full"><span class="nt-row-label">${esc(row.label)}</span><span class="nt-row-value">${esc(row.value)}</span></div>`);
      }
      parts.push('</section>');
    }
  };
  if (view.kind === 'single') renderOne(view);
  else view.sections.forEach(renderOne);
  box.innerHTML = parts.join('');
  box.hidden = false;
  $('home-empty').hidden = true;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** 搜索主流程（带连点锁） */
async function doSearch() {
  const q = $('search-input').value.trim();
  if (!q) return;
  const box = $('search-box');
  box.classList.add('nt-busy');
  try {
    const r = await withLock('search', async () => analyze(q));
    if (!r) return;
    if (r.type === 'theme') {
      applyTheme(r.value);
      storage.set('theme', r.value);
      $('search-input').value = '';
      return;
    }
    if (r.type === 'refuse') { openModal(r.message, null); return; }
    renderResult(buildResultView(r.results));
    storage.set('lastQuery', q);
  } catch (e) {
    openModal(userMessage(), null);
  } finally {
    box.classList.remove('nt-busy');
  }
}

/** 弹窗（先播后摘） */
let modalOk = null;
function openModal(text, onOk) {
  $('modal-text').textContent = text;
  $('modal').hidden = false;
  modalOk = onOk;
}
function closeModal() {
  const m = $('modal');
  // 先播后摘：先播 200ms 退场，再摘除节点
  m.classList.add('nt-modal-out');
  setTimeout(() => {
    m.hidden = true;
    m.classList.remove('nt-modal-out');
    modalOk = null;
  }, 200);
}

/** 关于页 4 卡 */
function renderAboutCards() {
  const wrap = $('about-cards');
  wrap.innerHTML = '';
  for (const c of SETTINGS.pages.about.cards) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'nt-card' + (c.danger ? ' nt-card-danger' : '');
    b.innerHTML = `<span>${esc(c.label)}</span><span class="nt-card-arrow">›</span>`;
    b.addEventListener('click', () => {
      if (c.id === 'clear') {
        openModal('确认清除全部本地数据？', () => { storage.clearAll(); closeModal(); });
      } else if (c.id === 'studio') showView('studio');
      else openDoc(c.id);
    });
    wrap.appendChild(b);
  }
}

/** 关于我们 3 卡 */
function renderStudioCards() {
  const wrap = $('studio-cards');
  wrap.innerHTML = '';
  for (const c of SETTINGS.pages.studio.cards) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'nt-card';
    b.innerHTML = `<span>${esc(c.label)}</span><span class="nt-card-arrow">›</span>`;
    b.addEventListener('click', () => openDoc(c.id));
    wrap.appendChild(b);
  }
}

/** 详情页（一稿 5 子页，文案单一真源） */
const DOCS = {
  protocol: () => ({
    title: '协议条款',
    html: `<p>${SETTINGS.brand} 为传统文化学习与研究辅助工具。使用本工具即表示你已知悉并同意以下条款：</p>
<h2>使用范围</h2><p>本工具输出为传统术数规则的机械推演结果，不含预测承诺，${SETTINGS.disclaimer}。</p>
<h2>数据与隐私</h2><p>全部演算在设备本地完成，不上传任何数据；本地数据可随时通过「清除数据」删除。</p>
<h2>知识产权</h2><p>代码以 AGPL-3.0 开源；品牌名称、界面与视觉设计归 ${SETTINGS.studio} 所有。</p>`,
  }),
  oss: () => ({
    title: '开源声明',
    html: `<p>本项目以 AGPL-3.0 协议开源，仓库 ntars/Xael。全部算法均为本项目自研实现；所参考的公开算法思想与数据来源在 NOTICE 与 README 中逐一声明。</p>
<h2>参考文献</h2><p>${REFS.map((r) => `${esc(r.书名)}${esc(r.作者)}`).join('；')}</p>
<p>${esc(REFS_NOTE)}</p>`,
  }),
  features: () => ({
    title: '功能介绍',
    html: `<p>在首页搜索框输入一句话即可，例如「排八字 1990年6月15日 10点」「今日黄历」「排奇门」。支持的问法：</p>
<ul><li>国历生辰：1990年6月15日 10点</li><li>农历生辰：农历1990年五月廿四</li><li>四柱：庚午年 壬午月 辛亥日 癸巳时</li></ul>`,
  }),
  refs: () => ({
    title: '参考文献',
    html: `<ul>${REFS.map((r) => `<li>${esc(r.书名)} ${esc(r.作者)}</li>`).join('')}</ul><p>${esc(REFS_NOTE)}</p>`,
  }),
  intro: () => ({
    title: '星玖工作室',
    html: `<p>${SETTINGS.studio}，专注传统文化数字化整理与工具化呈现。</p><p>官网：${SETTINGS.site}</p><p>${SETTINGS.icp} · ${SETTINGS.copyright}</p>`,
  }),
};

function openDoc(id) {
  const doc = DOCS[id] ? DOCS[id]() : null;
  if (!doc) return;
  $('doc-title').textContent = doc.title;
  $('doc-body').innerHTML = doc.html;
  showView('doc');
}

/** 启动 */
function boot() {
  installGuard();
  applyTheme(getTheme());
  if (typeof matchMedia !== 'undefined') {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(getTheme()));
  }
  renderAboutCards();
  renderStudioCards();

  $('btn-about').addEventListener('click', () => showView('about'));
  $('btn-about-back').addEventListener('click', () => showView('home'));
  $('btn-studio-back').addEventListener('click', () => showView('about'));
  $('btn-doc-back').addEventListener('click', () => showView('about'));
  $('modal-cancel').addEventListener('click', closeModal);
  $('modal-mask').addEventListener('click', closeModal);
  $('modal-ok').addEventListener('click', () => { if (modalOk) modalOk(); else closeModal(); });

  const input = $('search-input');
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  input.addEventListener('focus', () => $('search-box').classList.add('nt-ph-off'));

  document.body.classList.add('nt-cascade');

  // 开屏：停 1.2s → 400ms 缩放退场交接
  setTimeout(() => {
    const sp = $('splash');
    sp.classList.add('nt-splash-out');
    setTimeout(() => { sp.hidden = true; }, 400);
  }, 1200);

  // Service Worker（三级离线兜底）
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', boot);
