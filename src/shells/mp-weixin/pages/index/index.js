/**
 * pages/index/index.js —— 小程序壳（视图切换 + 搜索 + 结果渲染 + 弹窗）
 *
 * 大白话：这一层只管「页面上怎么显示、点了会怎样」。
 *   演算全部调 src/core（与 PWA 同一套内核）；文案全取 src/shared/settings.js（单一真源）；
 *   排版规则取 src/shared/result-format.js。三端共用一套，壳里不抄第二份。
 *
 * 与 PWA 壳逐条对齐的交互约定：
 *   · 搜索框是进结果的唯一入口，四种生辰写法（国历/农历/四柱/八字）都认；
 *   · 被闸门拦下时就地弹窗，不跳页，输入框保留原文方便改；
 *   · 结果写进会话，冷启动直接回到上次的结果页；
 *   · 开屏停 1200ms → 400ms 缩放退场；弹窗「先播后摘」；
 *   · 视图前进 320ms 三层视差（旧层退 -33%、新层压暗层渐显），返回反向；
 *   · 清除数据后把页内残留一起收干净，避免回首页还看到旧结果。
 */

const { analyze } = require('../../src/core/features/analyzer.js');
const { buildResultView } = require('../../src/shared/result-format.js');
const {
  about, getTheme, setTheme, themeSwitched, rowAction, clearData, setFeatureGroups,
} = require('../../src/shared/settings.js');
const { catalog } = require('../../src/core/features/registry.js');
const { saveConversation, loadConversation, clearConversation } = require('../../src/shared/conversation.js');
const { withLock } = require('../../src/shared/inflight.js');
const { installGuard, userMessage } = require('../../src/shared/guard.js');
const { MOTION } = require('../../src/shared/theme.js');
const { applyTheme } = require('../../theme-mp.js');

/** 视图层级：浅 → 深 为前进，深 → 浅 为返回（与 PWA 的 DEPTH 同一套） */
const DEPTH = { home: 0, result: 1, about: 1, us: 2, detail: 3 };
const VIEWS = ['home', 'result', 'about', 'us', 'detail'];

/** 开屏停留时长（体验参数，不是设计令牌） */
const SPLASH_HOLD = 1200;

/** 取文案（启动一次；清除数据后重新取） */
let A = about();

/** 把前端模型压成 WXML 能直接画的纯数据（WXML 里不做任何计算） */
function renderable(view) {
  const pack = (sec) => ({
    title: sec.title || '',
    lead: sec.lead || '',
    blocks: (sec.blocks || []).map((b, i) => (b.type === 'kv'
      ? { idx: i, type: 'kv', rows: b.rows.map((r, j) => ({ idx: j, label: r.label, value: r.value })) }
      : { idx: i, type: 'text', text: b.text })),
    tailNote: sec.tailNote || '',
  });

  if (view.kind === 'multi') {
    return {
      kind: 'multi',
      lead: '',
      blocks: [],
      sections: view.sections.map(pack),
      tailNote: view.tailNote || '',
    };
  }
  const one = pack(view);
  return {
    kind: 'single',
    lead: one.lead,
    blocks: one.blocks,
    sections: [],
    tailNote: one.tailNote,
  };
}


/** 动态安全区（旧仓 UIModule/safe-area.js 同一算法，代码重写）：
 *  WXSS 不支持 env(safe-area-inset-*)，自定义导航栏必须由 JS 算出行内值注入。
 *  top = max(59, 胶囊顶)（「关于」须在胶囊下方，不可同行）；
 *  bottom = max(34, 屏高 - 安全区底)（iPhone 手势条 / Android 虚拟按键）。 */
function calcSafeArea() {
  try {
    const info = (wx.getWindowInfo && wx.getWindowInfo()) || {};
    const rect = (wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect()) || null;
    const safe = info.safeArea || null;
    return {
      navTop: Math.max(59, rect ? rect.top : (info.statusBarHeight || 0)),
      safeBottom: Math.max(34, safe && info.screenHeight ? info.screenHeight - safe.bottom : 34),
    };
  } catch (e) { return { navTop: 59, safeBottom: 34 }; }
}

Page({
  data: {
    // 开屏
    splash: true,
    splashOut: false,
    logoSrc: '/static/icons/logo.png',

    // 视图
    view: 'home',
    hidden: { home: false, result: true, about: true, us: true, detail: true },
    layer: { home: 'front', result: '', about: '', us: '', detail: '' },
    dimClass: '',
    cascadeOn: false,

    // 主题 / 文案
    dark: false,
    logoSrc: '/static/icons/logo.png',
    txt: {},
    aboutRows: [],
    usRows: [],
    footLines: [],

    // 首页
    query: '',
    phOff: false,
    busy: false,

    // 结果
    question: '',
    result: null,

    // 详情
    detailTitle: '',
    detailItems: [],
    detailScrollTop: 0,

    // 弹窗 / 轻提示
    modal: { show: false, out: false, title: '', desc: '', ok: '确认', cancel: '取消', single: false },
    toastText: '',

    // 安全区（onLoad 里按真机覆写；默认=设计值）
    navTop: 59,
    safeBottom: 34,
    themeFade: false,
  },

  /** 非响应式内部状态（不进 setData，避免无意义的视图层通信） */
  _cur: 'home',       // 当前视图
  _detailBack: 'about', // 详情页返回目标
  _modalOnOk: null,
  _timer: { splash: 0, trans: 0, toast: 0, modalOut: 0 },
  _focused: false,

  /* ---------------- 生命周期 ---------------- */

  onLoad() {
    installGuard();
    A = about();
    this.fillText();
    const bootTheme = applyTheme(getTheme());   // 'system' 时按系统深浅色解析
    this.setData({
      dark: bootTheme === 'dark',
      logoSrc: bootTheme === 'dark' ? '/static/icons/logo-white.png' : '/static/icons/logo.png',
      ...calcSafeArea(),
    });

    // 系统深浅色变化跟随（无手动偏好时才切，与 PWA watchSystemTheme 同口径）
    if (wx.onThemeChange) {
      wx.onThemeChange(() => {
        if (getTheme() !== 'system') return; // 用户手动选过主题则不跟系统
        const actual = applyTheme('system');
        this.setData({ dark: actual === 'dark', logoSrc: actual === 'dark' ? '/static/icons/logo-white.png' : '/static/icons/logo.png' });
      });
    }

    // 刷新恢复：冷启动直接回到上次的结果页
    if (!this.restore()) this.show('home', true);

    // 开屏：停 1200ms → 挂退场类 → 400ms 后摘掉节点
    this._timer.splash = setTimeout(() => {
      this.setData({ splashOut: true });
      setTimeout(() => this.setData({ splash: false }), MOTION.dSplash);
    }, SPLASH_HOLD);
  },

  onUnload() {
    for (const k of Object.keys(this._timer)) clearTimeout(this._timer[k]);
  },

  /* ---------------- 文案装配 ---------------- */

  fillText() {
    // 功能介绍页的板块清单由功能表派生（不在别处抄第二份）
    setFeatureGroups(catalog());
    A = about();

    this.setData({
      txt: {
        name: A.name,
        slogan: A.slogan,
        about: '关于',
        usPageTitle: A.usPageTitle,
        navTitle: A.navTitle,
        resultPageTitle: A.resultPageTitle,
        questionLabel: A.questionLabel,
        searchPlaceholder: A.searchPlaceholder,
        homeDisclaimer: A.homeDisclaimer,
        icp: A.icp,
        footerCopy: A.footerCopy,
        exportBtn: (A.resultActions || {}).export || '导出图片',
        againBtn: (A.resultActions || {}).again || '再问一个',
        splashTitle: (A.splash || {}).title || A.name,
        splashSub: (A.splash || {}).sub || A.slogan,
      },
      aboutRows: A.aboutRows,
      usRows: A.usRows,
      footLines: A.aboutFoot || [],
    });
  },

  /* ---------------- 视图切换（三层视差 320ms） ---------------- */

  /**
   * 切页。boot=true 表示冷启动首屏：只播内容错落入场，不叠整层位移（两者同期会看成重影）。
   * @param {string} name 目标视图
   * @param {boolean} [boot]
   */
  show(name, boot) {
    if (VIEWS.indexOf(name) < 0) return;
    const from = this._cur;
    const forward = (DEPTH[name] || 0) >= (DEPTH[from] || 0);

    clearTimeout(this._timer.trans);

    const hidden = { home: true, result: true, about: true, us: true, detail: true };
    const layer = { home: '', result: '', about: '', us: '', detail: '' };
    hidden[name] = false;

    // 防御（旧仓教训）：切页路径必须显式关掉错落入场门控，否则上一次 boot 残留的 cascadeOn
    //   会让「整层滑入」叠加「内容各自上升」= 同一个动作动两遍（用户看到的「重复动画」）。
    this.setData({ cascadeOn: false });

    if (boot || from === name) {
      layer[name] = 'front';
      this.setData({
        hidden, layer, dimClass: '', cascadeOn: true, view: name,
      });
      this._timer.trans = setTimeout(() => this.setData({ cascadeOn: false }), MOTION.dPage + 200);
    } else {
      // 三层视差（对齐旧仓 stage 语义）：
      //   前进：新页在 front 从右滑入（nt-tf-in），旧页在 back 视差退到 -33%（nt-px-fwd）
      //   返回：旧页在 front 向右滑出（nt-tf-out），目标页在 back 从 -33% 回位（nt-px-back）
      if (forward) {
        layer[from] = 'back nt-px-fwd';
        layer[name] = 'front nt-tf-in';
      } else {
        layer[from] = 'front nt-tf-out';
        layer[name] = 'back nt-px-back';
      }
      this.setData({ hidden, layer, dimClass: forward ? 'nt-dim-in' : 'nt-dim-out' });
      // 收尾拆两帧（旧仓教训）：先清顶层动画类，下一帧再清底层 —— 同帧合并会闪一次纯底色
      this._timer.trans = setTimeout(() => {
        this.setData({ dimClass: '' });
        setTimeout(() => {
          const clean = { home: '', result: '', about: '', us: '', detail: '' };
          clean[name] = 'front';
          const hid = { home: true, result: true, about: true, us: true, detail: true };
          hid[name] = false;
          this.setData({ hidden: hid, layer: clean });
        }, 20);
      }, MOTION.dPage);
    }

    this._cur = name;
    this.setData({ view: name });
  },

  /* ---------------- 首页交互 ---------------- */

  /** 输入非空 或 已聚焦 → 常驻占位让位（HIG：占位提示不与真实输入重叠） */
  syncPlaceholder() {
    const off = !!this.data.query || this._focused;
    if (off !== this.data.phOff) this.setData({ phOff: off });
  },

  onInput(e) {
    this.setData({ query: e.detail.value });
    this.syncPlaceholder();
  },

  onFocus() { this._focused = true; this.syncPlaceholder(); },

  onBlur() { this._focused = false; this.syncPlaceholder(); },

  setInput(v) {
    this.setData({ query: v });
    this.syncPlaceholder();
  },

  /* ---------------- 搜索（唯一入口） ---------------- */

  onSend() {
    const raw = (this.data.query || '').trim();
    if (!raw || this.data.busy) return;

    withLock('send', async () => {
      this.setData({ busy: true });
      try {
        const r = await analyze(raw);

        // 主题指令：切完给一句回执，不进结果页
        if (r.type === 'theme') {
          let next = this.data.dark ? 'light' : 'dark';
          if (r.value === 'light' || r.value === 'dark') next = r.value;
          setTheme(next);
          const actual = applyTheme(next);
          // 320ms 过渡门控：挂 nt-theme-fade 让颜色走 320ms / 按压走 120ms，播完摘
          //（不挂=硬切；常挂=冷启动先白后黑闪，旧仓 v3.0.6 教训：只在切换瞬间挂）
          this.setData({ dark: actual === 'dark', logoSrc: actual === 'dark' ? '/static/icons/logo-white.png' : '/static/icons/logo.png', themeFade: true });
          setTimeout(() => { if (this.data.themeFade) this.setData({ themeFade: false }); }, MOTION.dTheme);
          this.setInput('');
          // 回执按「实际切到什么」说，免出现说切浅色却还是深色
          this.toast(themeSwitched[actual] || r.message || '主题已切换');
          return;
        }

        // 被闸门拦下 → 弹窗，输入框保留原文
        if (r.type === 'refuse') {
          this.noticeOf(r.code, r.message);
          return;
        }

        const view = buildResultView(r.results);
        if (!view) { this.noticeOf('kernel'); return; }

        this.setData({ question: raw, result: renderable(view) });
        saveConversation({ question: raw, results: r.results });
        this.setInput('');
        this.show('result');
      } catch (e) {
        this.noticeOf('kernel', userMessage());
      } finally {
        this.setData({ busy: false });
      }
    });
  },

  /** 被闸门拦下：就地弹窗，不跳页 */
  noticeOf(code, message) {
    const bm = A.birthModal || {};
    let title = bm.title;
    let desc = message || bm.desc;
    if (code === 'lunar') { title = bm.lunarTitle; desc = bm.lunarDesc; }
    else if (code === 'pillar') { title = bm.pillarTitle; desc = bm.pillarDesc; }
    else if (code === 'nonmeta') { title = bm.nonmetaTitle; desc = bm.nonmetaDesc; }
    else if (code === 'kernel') { title = bm.kernelTitle; desc = bm.kernelDesc; }
    this.openModal({ title, desc, ok: bm.confirm, single: true });
  },

  /* ---------------- 导航 ---------------- */

  goHome() {
    clearConversation();
    this.setData({
      question: '', result: null, detailTitle: '', detailItems: [],
    });
    this.setInput('');
    this.show('home');
  },

  goAbout() { this.show('about'); },

  /** 详情页返回：去向由 settings.backTarget 单一真源决定 */
  goDetailBack() { this.show(this._detailBack || 'about'); },

  /** 关于页 / 关于我们页的卡片点击：路由判定走 settings.rowAction（三端同一份） */
  onRow(e) {
    const id = e.currentTarget.dataset.id;
    const rows = (A.aboutRows || []).concat(A.usRows || []);
    const row = rows.filter((x) => x.id === id)[0];
    if (!row) return;

    const act = rowAction(row);
    if (act === 'clear') { this.openClearModal(); return; }
    if (act === 'us') { this.show('us'); return; }
    this.openDetail(id);
  },

  /** 详情页（一稿五子页：参考文献 / 功能介绍 / 星玖工作室 / 协议条款 / 开源声明） */
  openDetail(id) {
    const notes = (A.aboutNotes && A.aboutNotes[id]) || [];
    this._detailBack = (A.backTarget && A.backTarget[id]) || 'about';
    this.setData({
      detailTitle: (A.resTitle && A.resTitle[id]) || '',
      detailItems: notes.map((it, i) => ({ idx: i, h: it.h || '', kind: it.kind || 'group', text: it.text || '' })),
      detailScrollTop: 0,
    });
    this.show('detail');
  },

  /* ---------------- 弹窗（先播后摘） ---------------- */

  openModal(opt) {
    clearTimeout(this._timer.modalOut);
    this._modalOnOk = typeof opt.onOk === 'function' ? opt.onOk : null;
    this.setData({
      modal: {
        show: true,
        out: false,
        title: opt.title || '',
        desc: opt.desc || '',
        ok: opt.ok || '确认',
        cancel: opt.cancel || '取消',
        single: !!opt.single,
      },
    });
  },

  closeModal() {
    if (!this.data.modal.show || this.data.modal.out) return;
    this.setData({ 'modal.out': true });
    this._timer.modalOut = setTimeout(() => {
      this.setData({ modal: {
        show: false, out: false, title: '', desc: '', ok: '确认', cancel: '取消', single: false,
      } });
    }, MOTION.dModalOut);
  },

  onModalOk() {
    const fn = this._modalOnOk;
    this._modalOnOk = null;
    this.closeModal();
    if (fn) fn();
  },

  /** 点蒙层关闭；点弹窗本体不关（catchtap 已经拦住，这里再兜一次） */
  onMaskTap() { this.closeModal(); },

  noop() {},

  /** 清除数据确认弹窗 */
  openClearModal() {
    const cm = A.clearModal || {};
    this.openModal({
      title: cm.title,
      desc: cm.desc,
      ok: cm.confirm,
      cancel: cm.cancel,
      onOk: () => {
        clearData();
        clearConversation();
        // 清完把页内残留收干净，否则回首页还看得到上一次的结果
        this.setData({
          question: '', result: null, detailTitle: '', detailItems: [],
        });
        this.setInput('');
        // 清除会重置主题偏好（回落跟随系统）→ 重读并重新套色
        const actual = applyTheme(getTheme());
        this.setData({ dark: actual === 'dark', logoSrc: actual === 'dark' ? '/static/icons/logo-white.png' : '/static/icons/logo.png' });
        this.show('home');
        this.toast(cm.done || '已彻底清除缓存');
      },
    });
  },

  /* ---------------- 轻提示 ---------------- */

  toast(text) {
    clearTimeout(this._timer.toast);
    this.setData({ toastText: text || '' });
    this._timer.toast = setTimeout(() => this.setData({ toastText: '' }), 2000);
  },

  /* ---------------- 导出图片 ---------------- */

  /**
   * 导出：小程序走 canvas 2d + wx.canvasToTempFilePath + wx.previewImage（零相册权限）。
   * 排版规则全部来自 src/shared/export-image.js，与网页版同一份。
   */
  onExport() {
    if (!this.data.result) { this.toast('暂无可导出的内容'); return; }
    if (this.data.busy) return;

    withLock('export', () => new Promise((done) => {
      this.setData({ busy: true });
      try {
        const { drawToCanvas, planExport } = require('../../export-mp.js');
        const dark = this.data.dark;
        const plan = planExport(this.data.result, {
          question: this.data.question,
          dark,
          meta: (A.exportMeta || {}),
        });
        const failText = (A.resultActions && A.resultActions.fail) || '导出失败，请重试';
        drawToCanvas(this, plan).then((paths) => {
          if (!paths || !paths.length) { this.toast(failText); return; }
          wx.previewImage({ urls: paths, current: paths[0] });
          if (paths.length > 1) {
            this.toast((A.exportPaging || '内容较长，已分为 %n 张图片').replace('%n', String(paths.length)));
          }
        }).catch(() => {
          this.toast(failText);
        }).then(() => {
          this.setData({ busy: false });
          done();
        });
      } catch (e) {
        this.setData({ busy: false });
        this.toast((A.resultActions && A.resultActions.fail) || '导出失败，请重试');
        done();
      }
    }));
  },

  /* ---------------- 刷新恢复 ---------------- */

  /**
   * 冷启动回填：上次的结果还在会话里就直接回到结果页。
   * @returns {boolean} 是否恢复成功
   */
  restore() {
    const last = loadConversation();
    if (!last || !last.results || !last.results.length) return false;
    const view = buildResultView(last.results);
    if (!view) return false;
    this.setData({ question: last.question || '', result: renderable(view) });
    this.show('result', true);
    return true;
  },

  /* ---------------- 其他 ---------------- */

  /** 打开备案查询页（小程序里用 web-view 需要业务域名，这里只给复制提示） */
  openIcp() {
    wx.setClipboardData({
      data: 'https://beian.miit.gov.cn/',
      success: () => this.toast('备案查询地址已复制'),
    });
  },
});
