/**
 * static/app.js —— PWA 壳（视图切换 + 搜索 + 结果渲染 + 弹窗 + 导出）
 *
 * 大白话：这一层只管「页面上怎么显示、点了会怎样」。
 *   所有演算调 ../core（内核）；所有文案取 ../shared/settings.js（单一真源）；
 *   所有排版规则取 ../shared/result-format.js；所有配色/字号/动效取 theme.css 的变量。
 *   三个形态（PWA / 小程序 / uni-app）共用同一套内核、同一套文案，壳里不抄第二份。
 *
 * 关键约定（与旧版交互保持一致）：
 *   · 搜索框是进结果的唯一入口，四种生辰写法（国历/农历/四柱/八字）都认；
 *   · 被闸门拦下时就地弹窗，不跳页，输入框保留原文方便改；
 *   · 结果页刷新不丢：会话写进 storage，冷启动恢复上一次结果；
 *   · 开屏停留 1200ms 后 400ms 缩放退场；弹窗「先播后摘」；
 *   · 清除数据后把页内残留一起收干净，避免返回首页还看到旧结果。
 */

import { analyze } from '../core/features/analyzer.js';
import { buildResultView } from '../shared/result-format.js';
import {
  about, getTheme, setTheme, themeSwitched, rowAction, clearData, setFeatureGroups,
} from '../shared/settings.js';
import { catalog } from '../core/features/registry.js';
import { saveConversation, loadConversation, clearConversation } from '../shared/conversation.js';
import { withLock } from '../shared/inflight.js';
import { installGuard, userMessage } from '../shared/guard.js';
import {
  applyTheme, applyThemeWithFade, watchSystemTheme, MOTION,
} from '../shared/theme.js';
import {
  planLines, layoutRows, paginate, drawPage, maxPageHeight, LAYOUT,
} from '../shared/export-image.js';
import { EXPORT_DPR } from '../shared/export-metrics.js';

const $ = (id) => document.getElementById(id);

/** 文案单一真源（启动时取一次；清除数据后重新取） */
let A = about();

/* ------------------------------------------------------------------ *
 * 一、视图切换（双层视差转场 320ms）
 * ------------------------------------------------------------------ */

/**
 * 视图层级：浅 → 深 为前进，深 → 浅 为返回。
 * home(0) → result(1) / about(1) → us(2) → detail(3)。
 * us 必须比 about 深一级，否则「关于我们」返回会被判成前进，方向反掉。
 */
const DEPTH = { home: 0, result: 1, about: 1, us: 2, detail: 3 };
const VIEWS = ['home', 'result', 'about', 'us', 'detail'];

let curView = 'home';
let detailBack = 'about';
let transTimer = 0;

const layerOf = (name) => $('v-' + name);

/**
 * 切页。boot=true 表示冷启动首屏：只播内容错落入场，不叠整层位移（两者同期会看成重影）。
 */
function show(name, boot) {
  if (!VIEWS.includes(name)) return;
  const from = curView;
  const to = name;
  const forward = (DEPTH[to] || 0) >= (DEPTH[from] || 0);

  clearTimeout(transTimer);
  const dim = $('dim');

  VIEWS.forEach((k) => {
    const n = layerOf(k);
    if (!n) return;
    n.classList.remove('back', 'front', 'nt-px-fwd', 'nt-px-back', 'nt-cascade');
  });

  const nextEl = layerOf(to);
  const prevEl = layerOf(from);
  if (!nextEl) return;

  if (boot || from === to) {
    VIEWS.forEach((k) => {
      const n = layerOf(k);
      if (n) n.hidden = k !== to;
    });
    nextEl.classList.add('front', 'nt-cascade');
    transTimer = setTimeout(() => nextEl.classList.remove('nt-cascade'), MOTION.dPage + 200);
  } else {
    if (prevEl && prevEl !== nextEl) {
      prevEl.hidden = false;
      prevEl.classList.add('back');
      prevEl.classList.add(forward ? 'nt-px-fwd' : 'nt-px-back');
    }
    nextEl.hidden = false;
    nextEl.classList.add('front');
    if (dim) dim.classList.add(forward ? 'nt-dim-in' : 'nt-dim-out');
    transTimer = setTimeout(() => {
      VIEWS.forEach((k) => {
        const n = layerOf(k);
        if (!n) return;
        n.classList.remove('back', 'front', 'nt-px-fwd', 'nt-px-back');
        if (k !== to) n.hidden = true;
      });
      if (dim) dim.classList.remove('nt-dim-in', 'nt-dim-out');
    }, MOTION.dPage);
  }

  curView = to;
  const body = nextEl.querySelector('.nt-pgbody');
  if (body) body.scrollTop = 0;
}

/* ------------------------------------------------------------------ *
 * 二、主题
 * ------------------------------------------------------------------ */

/** 主题落地：CSS 变量 + 浏览器色条 + 深浅各用一张 logo */
function syncTheme(mode) {
  applyTheme(mode);
  const dark = document.documentElement.classList.contains('nt-dark');
  const src = dark ? 'static/icons/logo-white.png' : 'static/icons/logo.png';
  document.querySelectorAll('.nt-hero-logo, .nt-brand-logo, .nt-splash-logo').forEach((img) => {
    img.setAttribute('src', src);
  });
}

/* ------------------------------------------------------------------ *
 * 三、开屏
 * ------------------------------------------------------------------ */

const SPLASH_HOLD = 1200; // 停留时长（体验参数，不是设计令牌）

function runSplash() {
  const n = $('splash');
  if (!n) return;
  setTimeout(() => {
    n.classList.add('nt-splash-out');
    setTimeout(() => {
      if (n.parentNode) n.parentNode.removeChild(n);
    }, MOTION.dSplash);
  }, SPLASH_HOLD);
}

/* ------------------------------------------------------------------ *
 * 四、轻提示（单例复用，连点不叠一堆）
 * ------------------------------------------------------------------ */

let toastTimer = 0;

function toast(text) {
  const n = $('toast');
  if (!n) return;
  n.textContent = text;
  n.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { n.hidden = true; }, 2000);
}

/* ------------------------------------------------------------------ *
 * 五、弹窗（先播后摘）
 * ------------------------------------------------------------------ */

let modalOnOk = null;
let modalClosing = false;

/**
 * 打开弹窗。
 * @param {{title:string, desc:string, ok?:string, cancel?:string, single?:boolean, onOk?:Function}} opt
 */
function openModal(opt) {
  const mask = $('modal');
  if (!mask) return;
  clearTimeout(mask._outTimer);
  modalClosing = false;
  mask.classList.remove('nt-mask-out');
  $('modal-title').textContent = opt.title || '';
  $('modal-desc').textContent = opt.desc || '';
  $('modal-ok').textContent = opt.ok || '确认';
  const cancel = $('modal-cancel');
  cancel.textContent = opt.cancel || '取消';
  // 生辰提醒只有「知道了」一键：它不是取舍决策，没有可取消的动作。
  // 单键时把取消键从布局里真正摘掉（不是仅视觉隐藏），确认键才能占满整行。
  cancel.hidden = !!opt.single;
  modalOnOk = typeof opt.onOk === 'function' ? opt.onOk : null;
  mask.hidden = false;
}

function closeModal() {
  const mask = $('modal');
  if (!mask || modalClosing) return;
  modalClosing = true;
  mask.classList.add('nt-mask-out');
  mask._outTimer = setTimeout(() => {
    mask.hidden = true;
    mask.classList.remove('nt-mask-out');
    modalClosing = false;
  }, MOTION.dModalOut);
}

/* ------------------------------------------------------------------ *
 * 六、结果页渲染
 * ------------------------------------------------------------------ */

/** 建节点小工具（一律 textContent，不拼 HTML） */
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

/**
 * 渲染一段正文（单算法正文 / 多命中的其中一节）。
 * 按块类型走：kv 组排两栏（左 64px 标签、右值），text 段整行。
 */
function renderSection(box, sec) {
  for (const item of sec.blocks || []) {
    if (item.type === 'kv') {
      const host = el('div', 'res-kvlist');
      // 标签与值直接挂在 grid 容器上，中间不要再包一层行 div
      for (const r of item.rows) {
        host.appendChild(el('span', 'res-kv-label', r.label));
        host.appendChild(el('span', 'res-kv-text', r.value));
      }
      box.appendChild(host);
    } else {
      const wrap = el('div', 'res-block');
      wrap.appendChild(el('span', 'nt-dl-text nt-dl-text-light', item.text));
      box.appendChild(wrap);
    }
  }
  if (sec.tailNote) box.appendChild(el('span', 'res-tail-note', sec.tailNote));
}

let curResult = null;  // 当前结果模型（导出图片要用）
let curQuestion = '';  // 当前提问原文（导出图片顶部要复述）

function renderResult(view, question) {
  curResult = view;
  curQuestion = question || '';
  const blocksBox = $('result-blocks');
  const secsBox = $('result-sections');
  const leadEl = $('result-lead');
  blocksBox.innerHTML = '';
  secsBox.innerHTML = '';

  $('result-title').textContent = A.navTitle || '玄玖灵犀';
  $('result-pageh').textContent = A.resultPageTitle || '搜索结果';
  $('result-qlabel').textContent = A.questionLabel || '你的提问';
  $('result-question').textContent = question || '';

  if (view.kind === 'multi') {
    leadEl.hidden = true;
    blocksBox.hidden = true;
    secsBox.hidden = false;
    for (const s of view.sections) {
      const wrap = el('div', 'res-section');
      wrap.appendChild(el('span', 'res-section-title nt-dl-h1', s.title));
      renderSection(wrap, s);
      secsBox.appendChild(wrap);
    }
    if (view.tailNote) secsBox.appendChild(el('span', 'res-tail-note', view.tailNote));
  } else {
    secsBox.hidden = true;
    blocksBox.hidden = false;
    leadEl.hidden = !view.lead;
    leadEl.textContent = view.lead || '';
    // 导语已单独占一行，正文里不再重复；没有正文块时传空，靠导语兜底
    renderSection(blocksBox, { blocks: view.blocks });
  }
}

/* ------------------------------------------------------------------ *
 * 七、搜索（唯一入口）
 * ------------------------------------------------------------------ */

let inputFocused = false;

function syncPlaceholder() {
  const pill = $('home-pill');
  const input = $('home-input');
  if (!pill || !input) return;
  // 输入非空 或 已聚焦 → 常驻文案让位（HIG：占位提示不与真实输入重叠）
  pill.classList.toggle('nt-ph-off', !!input.value || inputFocused);
}

function setInput(v) {
  const input = $('home-input');
  if (input) input.value = v;
  syncPlaceholder();
}

/** 被闸门拦下：就地弹窗，不跳页 */
function noticeOf(code, message) {
  const bm = A.birthModal;
  let title = bm.title;
  let desc = message || bm.desc;
  if (code === 'lunar') { title = bm.lunarTitle; desc = bm.lunarDesc; }
  else if (code === 'pillar') { title = bm.pillarTitle; desc = bm.pillarDesc; }
  else if (code === 'nonmeta') { title = bm.nonmetaTitle; desc = bm.nonmetaDesc; }
  else if (code === 'kernel') { title = bm.kernelTitle; desc = bm.kernelDesc; }
  openModal({ title, desc, ok: bm.confirm, single: true });
}

async function send() {
  const input = $('home-input');
  if (!input) return;
  const raw = input.value.trim();
  const sendBtn = $('home-send');

  await withLock('send', async () => {
    if (sendBtn) sendBtn.classList.add('nt-busy');
    try {
      if (!raw) return;
      const r = await analyze(raw);

      // 主题指令：切完给一句回执，不进结果页
      if (r.type === 'theme') {
        const cur = document.documentElement.classList.contains('nt-dark') ? 'dark' : 'light';
        let next = cur === 'dark' ? 'light' : 'dark';
        if (r.value === 'light' || r.value === 'dark') next = r.value;
        // 回执按「实际切到什么」说，不用解析器给的中间值（否则会出现「已切换为浅色主题」却仍是深色）
        const message = next === document.documentElement.classList.contains('nt-dark') ? r.message : '';
        setTheme(next);
        applyThemeWithFade(next);
        syncTheme(next);
        setInput('');
        toast(themeSwitched[next] || message || '主题已切换');
        return;
      }

      // 被拦下 → 弹窗，输入框保留原文
      if (r.type === 'refuse') {
        noticeOf(r.code, r.message);
        return;
      }

      const view = buildResultView(r.results);
      if (!view) { noticeOf('kernel'); return; }
      renderResult(view, raw);
      saveConversation({ question: raw, results: r.results });
      setInput('');
      show('result');
    } catch (e) {
      noticeOf('kernel', userMessage());
    } finally {
      if (sendBtn) sendBtn.classList.remove('nt-busy');
    }
  });
}

/* ------------------------------------------------------------------ *
 * 八、导出图片
 * ------------------------------------------------------------------ */

/** 导出配色跟着当前深浅色走（2 倍图，颜色写死成具体值，画布不认 CSS 变量） */
function colorsOf() {
  const dark = document.documentElement.classList.contains('nt-dark');
  return dark
    ? { bg: '#000000', ink: '#ffffff', muted: 'rgba(255,255,255,.5)', foot: 'rgba(255,255,255,.48)' }
    : { bg: '#ffffff', ink: '#000000', muted: 'rgba(0,0,0,.56)', foot: 'rgba(0,0,0,.55)' };
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) a.parentNode.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

async function exportImage() {
  if (!curResult) { toast('暂无可导出的内容'); return; }
  const btn = $('result-export');

  await withLock('export', async () => {
    if (btn) btn.classList.add('nt-busy');
    try {
      // 量文字宽度要一个 2D 上下文：先建一张量尺画布
      const ruler = document.createElement('canvas');
      const rctx = ruler.getContext('2d');
      const meta = A.exportMeta || {};
      // 导出图 = 结果页镜像：提问 → 推演结果 → 附注，右下两码
      const src = {
        question: curQuestion || '',
        questionLabel: meta.questionLabel || '你的提问',
        title: meta.resultLabel || '玄玖灵犀推演结果：',
        lead: '',
        kind: curResult.kind,
        blocks: curResult.blocks,
        sections: curResult.sections,
        tailNote: curResult.tailNote,
      };
      // 两码先解码成 Image，才能画进位图
      const qrList = meta.qrImages || [];
      const qrImages = await Promise.all(qrList.map((it) => new Promise((done) => {
        const im = new Image();
        // decode() 确保位图真的可画（只等 onload 时 drawImage 可能画出空白）
        im.onload = () => {
          if (typeof im.decode === 'function') im.decode().then(() => done({ img: im, label: it.label })).catch(() => done({ img: im, label: it.label }));
          else done({ img: im, label: it.label });
        };
        im.onerror = () => done(null); // 图挂了就少画一个码，别整张失败
        im.src = it.path;
      })));
      // 覆盖成「已解码的位图 + 文字」形式，drawPage 只认这个
      meta.qrImages = qrImages.filter(Boolean);

      const rows = planLines(src, rctx);
      const { rows: placed, height } = layoutRows(rows, { qrCount: (meta.qrImages || []).length });
      const pageH = maxPageHeight(LAYOUT.width);
      const pages = paginate(height, pageH);
      const colors = colorsOf();

      for (let i = 0; i < pages.length; i += 1) {
        const page = pages[i];
        const cv = document.createElement('canvas');
        cv.width = LAYOUT.width * EXPORT_DPR;
        cv.height = Math.ceil(page.height) * EXPORT_DPR;
        const ctx = cv.getContext('2d');
        ctx.scale(EXPORT_DPR, EXPORT_DPR);
        drawPage(ctx, {
          colors,
          meta,
          rows: placed
            .filter((r) => r.y + r.h > page.from && r.y < page.to)
            .map((r) => ({ ...r, y: r.y - page.from })),
          height: page.height,
          page: { index: i + 1, total: pages.length },
          pageLabel: meta.pageLabel,
        });
        // 逐页出图：一张画布一块内存，画完立刻吐 blob 释放
        // eslint-disable-next-line no-await-in-loop
        const blob = await new Promise((done) => { cv.toBlob(done, 'image/png'); });
        if (blob) saveBlob(blob, '玄玖灵犀-' + (i + 1) + '.png');
      }
      if (pages.length > 1) {
        toast((A.exportPaging || '内容较长，已分为 %n 张图片').replace('%n', String(pages.length)));
      }
    } catch (e) {
      toast((A.resultActions && A.resultActions.fail) || '导出失败，请重试');
    } finally {
      if (btn) btn.classList.remove('nt-busy');
    }
  });
}

/* ------------------------------------------------------------------ *
 * 九、关于页 / 关于我们 / 详情页
 * ------------------------------------------------------------------ */

/** 一张设置卡：标题 + 描述 + 右箭头 */
function makeRow(row, onDanger) {
  const wrap = el('div', 'nt-setrow' + (row.danger ? ' danger' : ''));
  wrap.setAttribute('role', 'button');
  wrap.setAttribute('tabindex', '0');
  const left = el('span', 'nt-setl');
  left.appendChild(el('span', 'nt-setl-title', row.title));
  left.appendChild(el('span', 'nt-setl-desc', row.desc));
  wrap.appendChild(left);
  wrap.appendChild(el('span', row.danger ? 'nt-icon nt-i-chev-danger' : 'nt-icon nt-i-chev'));

  const go = () => {
    // 路由判定走 settings.rowAction（单一真源，三端同一份）
    const act = rowAction(row);
    if (act === 'clear') { if (onDanger) onDanger(); return; }
    if (act === 'us') { show('us'); return; }
    openDetail(row.id);
  };
  wrap.addEventListener('click', go);
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
  });
  return wrap;
}

function buildRows(box, rows, onDanger) {
  if (!box) return;
  box.innerHTML = '';
  for (const row of rows || []) box.appendChild(makeRow(row, onDanger));
}

/** 详情页（一稿五子页：参考文献 / 功能介绍 / 星玖工作室 / 协议条款 / 开源声明） */
function openDetail(id) {
  const notes = (A.aboutNotes && A.aboutNotes[id]) || [];
  $('detail-title').textContent = (A.resTitle && A.resTitle[id]) || '';
  $('detail-navtitle').textContent = A.navTitle || '玄玖灵犀';
  detailBack = (A.backTarget && A.backTarget[id]) || 'about';

  const box = $('detail-items');
  box.innerHTML = '';
  for (const it of notes) {
    const wrap = el('div', 'nt-dl-item');
    if (it.h) wrap.appendChild(el('span', it.kind === 'book' ? 'nt-dl-h2' : 'nt-dl-h1', it.h));
    if (it.text) wrap.appendChild(el('span', 'nt-dl-text', it.text));
    box.appendChild(wrap);
  }
  show('detail');
}

/* ------------------------------------------------------------------ *
 * 十、文案装配
 * ------------------------------------------------------------------ */

function fillFoot() {
  const set = (id, v) => { const n = $(id); if (n && v != null) n.textContent = v; };
  set('home-icp', A.icp);
  set('home-copy', A.footerCopy);
  set('about-copy', A.footerCopy);
  set('us-copy', A.footerCopy);

  // 结果 / 关于我们 / 详情页页脚两行（aboutFoot 单一真源）
  for (const id of ['result-foot', 'us-foot', 'detail-foot']) {
    const box = $(id);
    if (!box) continue;
    box.innerHTML = '';
    for (const line of A.aboutFoot || []) box.appendChild(el('span', 'nt-setfoot-line', line));
  }
  // 关于页页脚：第一行是说明，第二行是版权
  const aboutFoot = $('about-foot');
  if (aboutFoot && A.aboutFoot && A.aboutFoot.length) {
    aboutFoot.innerHTML = '';
    for (const line of A.aboutFoot) aboutFoot.appendChild(el('span', 'nt-setfoot-line', line));
  }
}

function fillText() {
  const set = (id, v) => { const n = $(id); if (n && v != null) n.textContent = v; };
  set('splash-name', A.splash && A.splash.title);
  set('splash-sub', A.splash && A.splash.sub);
  set('home-title', A.name);
  set('home-note', A.homeDisclaimer);
  set('about-slogan', A.slogan);
  set('result-export', A.resultActions && A.resultActions.export);
  set('result-again', A.resultActions && A.resultActions.again);

  const ph = $('home-ph');
  if (ph && A.searchPlaceholder) {
    ph.innerHTML = '';
    ph.appendChild(el('span', 'nt-ph-item', A.searchPlaceholder));
  }
}

function fillLists() {
  // 功能介绍页的板块清单由功能表派生（不在别处抄第二份）
  setFeatureGroups(catalog());
  A = about();
  buildRows($('about-list'), A.aboutRows, openClearModal);
  buildRows($('us-list'), A.usRows);
}

/** 清除数据确认弹窗 */
function openClearModal() {
  const cm = A.clearModal;
  openModal({
    title: cm.title,
    desc: cm.desc,
    ok: cm.confirm,
    cancel: cm.cancel,
    onOk: () => {
      clearData();
      clearConversation();
      // 清完把页内残留收干净，否则回首页还看得到上一次的结果
      curResult = null;
      $('result-blocks').innerHTML = '';
      $('result-sections').innerHTML = '';
      $('result-question').textContent = '';
      $('result-lead').textContent = '';
      $('detail-items').innerHTML = '';
      setInput('');
      // 清除会重置主题偏好（回落跟随系统）→ 重读并重新套色
      syncTheme(getTheme());
      show('home');
      toast(cm.done || '已彻底清除缓存');
    },
  });
}

/** 刷新恢复：冷启动直接回到上次的结果页 */
function restore() {
  const last = loadConversation();
  if (!last || !last.results || !last.results.length) return false;
  const view = buildResultView(last.results);
  if (!view) return false;
  renderResult(view, last.question);
  show('result', true);
  return true;
}

/** PWA 安装引导（beforeinstallprompt → 显示安装条） */
function initInstall() {
  let deferred = null;
  const bar = $('installbar');
  const btn = $('installbtn');
  if (!bar) return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    bar.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    bar.hidden = true;
  });
  if (btn) {
    btn.addEventListener('click', () => {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(() => { deferred = null; bar.hidden = true; });
    });
  }
}

/** 返回首页并清空当前一问 */
function goHome() {
  clearConversation();
  curResult = null;
  setInput('');
  show('home');
}

function bind() {
  const input = $('home-input');
  const sendBtn = $('home-send');
  if (input) {
    input.addEventListener('input', syncPlaceholder);
    input.addEventListener('focus', () => { inputFocused = true; syncPlaceholder(); });
    input.addEventListener('blur', () => { inputFocused = false; syncPlaceholder(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  }
  if (sendBtn) {
    sendBtn.addEventListener('click', send);
    // span 不是原生 button，键盘 Enter / Space 要显式接住（无障碍）
    sendBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); send(); }
    });
  }

  const on = (id, fn) => { const n = $(id); if (n) n.addEventListener('click', fn); };
  on('home-about', () => show('about'));
  on('about-back', () => show('home'));
  on('us-back', () => show('about'));
  on('detail-back', () => show(detailBack || 'about'));
  on('result-back', goHome);
  on('result-again', goHome);
  on('result-export', exportImage);

  on('modal-cancel', closeModal);
  on('modal-ok', () => {
    const fn = modalOnOk;
    closeModal();
    if (fn) fn();
  });
  const mask = $('modal');
  if (mask) mask.addEventListener('click', (e) => { if (e.target === mask) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

/* ------------------------------------------------------------------ *
 * 十一、启动
 * ------------------------------------------------------------------ */

function boot() {
  installGuard();
  syncTheme(getTheme());
  // 主题交叉过渡门控：只在主动切换的瞬间挂，冷启动不挂（否则首屏会先白后黑闪一次）
  watchSystemTheme((v) => syncTheme(v));

  A = about();
  fillText();
  fillLists();
  fillFoot();
  bind();
  initInstall();
  runSplash();

  if (!restore()) show('home', true);

  // 注册 Service Worker（离线可开）
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* 无 SW 环境照常使用 */ });
  }
}

boot();
