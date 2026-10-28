<!--
  pages/index/index.vue —— uni-app 单页壳（与 PWA / 微信小程序同构同版式）

  结构与另外两端一一对应：同一个 .nt-stage 舞台、同一套 .nt-layer 视图层、
  同样的 .nt-mask 弹窗与 .nt-toast 轻提示；类名沿用 theme.css，
  差异只在标签：div→view、span→text、img→image，点击用 @tap。

  样式全部写在 <style> 里，单位统一使用像素值，
  不使用伪元素与通配选择器——这样同一份样式在小程序端编译也成立。
-->
<template>
  <view class="nt-page-safe" :class="dark ? 'nt-dark' : ''">

    <!-- ============ 开屏：停 1200ms 后 400ms 缩放退场 ============ -->
    <view v-if="splash" class="nt-splash" :class="{ 'nt-splash-out': splashOut }">
      <view class="nt-splash-brand">
        <image class="nt-splash-logo" :src="logoSrc" mode="aspectFit" />
        <text class="nt-splash-name">{{ txt.splashTitle }}</text>
      </view>
      <text class="nt-splash-sub">{{ txt.splashSub }}</text>
    </view>

    <!-- ============ 视图舞台 ============ -->
    <view class="nt-stage">

      <!-- ---------- 首页 ---------- -->
      <view v-if="!hidden.home" class="nt-layer" :class="layer.home">
        <view class="home">
          <view class="nt-nav">
            <view class="nt-nav-about" hover-class="nt-hover" @tap="goAbout">{{ txt.about }}</view>
          </view>

          <view class="nt-hero" :class="{ 'nt-cascade': cascadeOn }">
            <image class="nt-hero-logo" :src="logoSrc" mode="aspectFit" />
            <text class="nt-hero-title">{{ txt.name }}</text>
            <view class="nt-pill nt-hero-pill" :class="{ 'nt-ph-off': phOff }">
              <view class="nt-halo" />
              <input
                class="nt-pill-input"
                :value="query"
                confirm-type="search"
                cursor-spacing="24"
                @input="onInput"
                @focus="onFocus"
                @blur="onBlur"
                @confirm="onSend"
              />
              <view class="nt-ph">
                <view class="nt-ph-item">{{ txt.searchPlaceholder }}</view>
              </view>
              <view class="nt-pill-search" :class="{ 'nt-busy': busy }" hover-class="nt-hover" @tap="onSend">
                <view class="nt-icon nt-i-search" />
              </view>
            </view>
            <text class="nt-hero-note">{{ txt.homeDisclaimer }}</text>
          </view>

          <view class="nt-foot">
            <text class="nt-setfoot-line" @tap="openIcp">{{ txt.icp }}</text>
            <text class="nt-setfoot-line">{{ txt.footerCopy }}</text>
          </view>
        </view>
      </view>

      <!-- ---------- 结果页 ---------- -->
      <view v-if="!hidden.result" class="nt-layer" :class="layer.result">
        <view class="res">
          <view class="nt-nav">
            <view class="nt-nav-back" hover-class="nt-hover" @tap="goHome">
              <view class="nt-icon nt-i-back" />
            </view>
            <text class="nt-nav-title">{{ txt.navTitle }}</text>
          </view>

          <view class="nt-page-h" :class="{ 'nt-cascade': cascadeOn }">{{ txt.resultPageTitle }}</view>

          <scroll-view class="nt-pgbody" scroll-y scroll-with-animation>
            <view class="nt-dl-card">
              <text class="nt-dl-h1">{{ txt.questionLabel }}</text>
              <text class="nt-dl-text nt-dl-text-light">{{ question }}</text>
              <text v-if="result && result.lead" class="nt-dl-h1 res-lead-h">{{ result.lead }}</text>

              <!-- 单算法：kv 两栏 / 整段 -->
              <view v-if="result && result.kind === 'single'" class="res-blocks">
                <view v-for="b in result.blocks" :key="b.idx" class="res-block">
                  <view v-if="b.type === 'kv'" class="res-kvlist">
                    <view v-for="r in b.rows" :key="r.idx" class="res-kvrow">
                      <text class="res-kv-label">{{ r.label }}</text>
                      <text class="res-kv-text">{{ r.value }}</text>
                    </view>
                  </view>
                  <text v-else class="res-kv-text">{{ b.text }}</text>
                </view>
              </view>

              <!-- 多命中：分小节并列 -->
              <view v-if="result && result.kind === 'multi'" class="res-sections">
                <view v-for="(s, si) in result.sections" :key="si" class="res-section">
                  <text class="res-section-title nt-dl-h1">{{ s.title }}</text>
                  <view v-if="s.lead" class="res-kv-text">{{ s.lead }}</view>
                  <view v-for="b in s.blocks" :key="b.idx" class="res-block">
                    <view v-if="b.type === 'kv'" class="res-kvlist">
                      <view v-for="r in b.rows" :key="r.idx" class="res-kvrow">
                        <text class="res-kv-label">{{ r.label }}</text>
                        <text class="res-kv-text">{{ r.value }}</text>
                      </view>
                    </view>
                    <text v-else class="res-kv-text">{{ b.text }}</text>
                  </view>
                </view>
              </view>

              <text v-if="result && result.tailNote" class="res-tail-note">{{ result.tailNote }}</text>
            </view>
          </scroll-view>

          <view class="nt-para" />
          <view class="nt-dual">
            <view class="nt-pill-btn ghost" :class="{ 'nt-busy': busy }" hover-class="nt-hover" @tap="onExport">
              {{ txt.exportBtn }}
            </view>
            <view class="nt-pill-btn" hover-class="nt-hover" @tap="goHome">{{ txt.againBtn }}</view>
          </view>
          <view class="nt-foot">
            <text class="nt-setfoot-line">{{ txt.icp }}</text>
            <text class="nt-setfoot-line">{{ txt.footerCopy }}</text>
          </view>
        </view>
      </view>

      <!-- ---------- 关于 ---------- -->
      <view v-if="!hidden.about" class="nt-layer" :class="layer.about">
        <view class="ab">
          <view class="nt-nav">
            <view class="nt-nav-back" hover-class="nt-hover" @tap="goHome">
              <view class="nt-icon nt-i-back" />
            </view>
            <text class="nt-nav-title">{{ txt.about }}</text>
          </view>
          <view class="nt-pgbody nt-pt">
            <view class="nt-brand" :class="{ 'nt-cascade': cascadeOn }">
              <image class="nt-brand-logo" :src="logoSrc" mode="aspectFit" />
              <text class="nt-brand-name">{{ txt.name }}</text>
              <text class="nt-brand-sub">{{ txt.slogan }}</text>
            </view>
            <view class="nt-setlist ab-setlist" :class="{ 'nt-cascade': cascadeOn }">
              <view
                v-for="row in aboutRows"
                :key="row.id"
                class="nt-setrow"
                :class="{ danger: row.danger }"
                hover-class="nt-hover"
                @tap="onRow(row)"
              >
                <view class="nt-setl">
                  <text class="nt-setl-title">{{ row.title }}</text>
                  <text v-if="row.desc" class="nt-setl-desc">{{ row.desc }}</text>
                </view>
                <view class="nt-icon" :class="row.danger ? 'nt-i-chev-danger' : 'nt-i-chev'" />
              </view>
            </view>
          </view>
          <view class="nt-foot">
            <text class="nt-setfoot-line">{{ txt.icp }}</text>
            <text class="nt-setfoot-line">{{ txt.footerCopy }}</text>
          </view>
        </view>
      </view>

      <!-- ---------- 关于我们 ---------- -->
      <view v-if="!hidden.us" class="nt-layer" :class="layer.us">
        <view class="ab">
          <view class="nt-nav">
            <view class="nt-nav-back" hover-class="nt-hover" @tap="goAbout">
              <view class="nt-icon nt-i-back" />
            </view>
            <text class="nt-nav-title">{{ txt.usPageTitle }}</text>
          </view>
          <view class="nt-pgbody nt-pt">
            <view class="nt-setlist" :class="{ 'nt-cascade': cascadeOn }">
              <view
                v-for="row in usRows"
                :key="row.id"
                class="nt-setrow"
                :class="{ danger: row.danger }"
                hover-class="nt-hover"
                @tap="onRow(row)"
              >
                <view class="nt-setl">
                  <text class="nt-setl-title">{{ row.title }}</text>
                  <text v-if="row.desc" class="nt-setl-desc">{{ row.desc }}</text>
                </view>
                <view class="nt-icon" :class="row.danger ? 'nt-i-chev-danger' : 'nt-i-chev'" />
              </view>
            </view>
          </view>
          <view class="nt-foot">
            <text class="nt-setfoot-line">{{ txt.icp }}</text>
            <text class="nt-setfoot-line">{{ txt.footerCopy }}</text>
          </view>
        </view>
      </view>

      <!-- ---------- 详情（一稿五子页） ---------- -->
      <view v-if="!hidden.detail" class="nt-layer" :class="layer.detail">
        <view class="dl">
          <view class="nt-nav">
            <view class="nt-nav-back" hover-class="nt-hover" @tap="goDetailBack">
              <view class="nt-icon nt-i-back" />
            </view>
            <text class="nt-nav-title">{{ txt.navTitle }}</text>
          </view>
          <view class="nt-page-h" :class="{ 'nt-cascade': cascadeOn }">{{ detailTitle }}</view>
          <scroll-view class="nt-pgbody" scroll-y scroll-with-animation :scroll-top="detailScrollTop">
            <view class="nt-dl-card">
              <view v-for="it in detailItems" :key="it.idx" class="nt-dl-item">
                <text v-if="it.h" class="nt-dl-h2" :class="{ 'nt-dl-h1': it.kind === 'group' }">{{ it.h }}</text>
                <text v-if="it.text" class="nt-dl-text">{{ it.text }}</text>
              </view>
            </view>
          </scroll-view>
          <view class="nt-foot">
            <text class="nt-setfoot-line">{{ txt.icp }}</text>
            <text class="nt-setfoot-line">{{ txt.footerCopy }}</text>
          </view>
        </view>
      </view>

      <!-- 压暗层（视图转场时淡入淡出） -->
      <view class="nt-dim" :class="dimClass" />
    </view>

    <!-- ============ 弹窗（先播后摘） ============ -->
    <view v-if="modal.show" class="nt-mask" :class="{ 'nt-mask-out': modal.out }" @tap="onMaskTap">
      <view class="nt-modal" @tap.stop="noop">
        <text class="nt-modal-title">{{ modal.title }}</text>
        <scroll-view v-if="modal.desc" class="nt-modal-desc" scroll-y>
          <text class="nt-modal-desc-text">{{ modal.desc }}</text>
        </scroll-view>
        <view class="nt-modal-btns">
          <view v-if="!modal.single" class="nt-pill-btn ghost" hover-class="nt-hover" @tap="closeModal">
            {{ modal.cancel }}
          </view>
          <view class="nt-pill-btn" hover-class="nt-hover" @tap="onModalOk">{{ modal.ok }}</view>
        </view>
      </view>
    </view>

    <!-- ============ 轻提示 ============ -->
    <view v-if="toastText" class="nt-toast">{{ toastText }}</view>

    <!-- ============ 导出用的离屏画布 ============ -->
    <canvas canvas-id="exportCanvas" id="exportCanvas" class="nt-export-canvas" />
  </view>
</template>

<script>
import { analyze } from '../../../../core/features/analyzer.js';
import { buildResultView } from '../../../../shared/result-format.js';
import {
  about, getTheme, setTheme, themeSwitched, rowAction, clearData, setFeatureGroups,
} from '../../../../shared/settings.js';
import { catalog } from '../../../../core/features/registry.js';
import { saveConversation, loadConversation, clearConversation } from '../../../../shared/conversation.js';
import { withLock } from '../../../../shared/inflight.js';
import { installGuard, userMessage } from '../../../../shared/guard.js';
import { MOTION } from '../../../../shared/theme.js';
import { applyTheme, resolveTheme } from '../../theme-uni.js';
import { uniExport } from '../../export-uni.js';

/** 视图层级：浅 → 深 为前进，深 → 浅 为返回（三端同一套） */
const DEPTH = { home: 0, result: 1, about: 1, us: 2, detail: 3 };
const VIEWS = ['home', 'result', 'about', 'us', 'detail'];

/** 开屏停留时长（体验参数，不是设计令牌） */
const SPLASH_HOLD = 1200;

/** 文案（启动取一次；清除数据后重取） */
let A = about();

/** 把前端模型压成模板能直接画的纯数据（模板里不做计算） */
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

export default {
  data() {
    return {
      // 开屏
      splash: true,
      splashOut: false,
      logoSrc: '/static/icons/logo.png',

      // 视图
      hidden: { home: false, result: true, about: true, us: true, detail: true },
      layer: { home: 'front', result: '', about: '', us: '', detail: '' },
      dimClass: '',
      cascadeOn: false,

      // 主题 / 文案
      dark: false,
      txt: {},
      aboutRows: [],
      usRows: [],

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
    };
  },

  onLoad() {
    installGuard();
    this._cur = 'home';
    this._detailBack = 'about';
    this._modalOnOk = null;
    this._focused = false;
    this._timer = { splash: 0, trans: 0, toast: 0, modalOut: 0 };

    this.fillText();
    this.setData({ dark: resolveTheme() === 'dark' });

    if (!this.restore()) this.show('home', true);

    this._timer.splash = setTimeout(() => {
      this.setData({ splashOut: true });
      setTimeout(() => this.setData({ splash: false }), MOTION.dSplash);
    }, SPLASH_HOLD);
  },

  onUnload() {
    const t = this._timer || {};
    for (const k of Object.keys(t)) clearTimeout(t[k]);
  },

  methods: {
    /* ---------------- 文案装配 ---------------- */

    fillText() {
      // 功能介绍页板块由功能表派生（不在别处抄第二份）
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

      if (boot || from === name) {
        layer[name] = 'front';
        this.setData({ hidden, layer, dimClass: '', cascadeOn: true });
        this._timer.trans = setTimeout(() => this.setData({ cascadeOn: false }), MOTION.dPage + 200);
      } else {
        // 三层视差（对齐旧仓 stage 语义）：前进=新页右滑入+旧页视差退；返回=旧页右滑出+目标页回位
        if (forward) {
          layer[from] = 'back nt-px-fwd';
          layer[name] = 'front nt-tf-in';
        } else {
          layer[from] = 'front nt-tf-out';
          layer[name] = 'back nt-px-back';
        }
        this.setData({ hidden, layer, dimClass: forward ? 'nt-dim-in' : 'nt-dim-out' });
        this._timer.trans = setTimeout(() => {
          const clean = { home: '', result: '', about: '', us: '', detail: '' };
          clean[name] = 'front';
          const hid = { home: true, result: true, about: true, us: true, detail: true };
          hid[name] = false;
          this.setData({ hidden: hid, layer: clean, dimClass: '' });
        }, MOTION.dPage);
      }

      this._cur = name;
    },

    /* ---------------- 首页交互 ---------------- */

    /** 输入非空或已聚焦 → 常驻占位让位 */
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
            this.setData({
              dark: actual === 'dark',
              logoSrc: actual === 'dark' ? '/static/icons/logo-white.png' : '/static/icons/logo.png',
            });
            this.setInput('');
            // 回执按「实际切到什么」说，免出现说切浅色却还是深色
            this.toast(themeSwitched[actual] || r.message || '主题已切换');
            return;
          }

          // 被闸门拦下 → 弹窗，输入框保留原文
          if (r.type === 'refuse') { this.noticeOf(r.code, r.message); return; }

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
      this.setData({ question: '', result: null, detailTitle: '', detailItems: [] });
      this.setInput('');
      this.show('home');
    },

    goAbout() { this.show('about'); },

    goDetailBack() { this.show(this._detailBack || 'about'); },

    /** 卡片点击：路由判定走 settings.rowAction（三端同一份） */
    onRow(row) {
      const act = rowAction(row);
      if (act === 'clear') { this.openClearModal(); return; }
      if (act === 'us') { this.show('us'); return; }
      this.openDetail(row.id);
    },

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
        this.setData({
          modal: {
            show: false, out: false, title: '', desc: '', ok: '确认', cancel: '取消', single: false,
          },
        });
      }, MOTION.dModalOut);
    },

    onModalOk() {
      const fn = this._modalOnOk;
      this._modalOnOk = null;
      this.closeModal();
      if (fn) fn();
    },

    onMaskTap() { this.closeModal(); },

    noop() {},

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
          this.setData({ question: '', result: null, detailTitle: '', detailItems: [] });
          this.setInput('');
          // 清除会重置主题偏好（回落跟随系统）→ 重读并重新套色
          const actual = applyTheme(getTheme());
          this.setData({
            dark: actual === 'dark',
            logoSrc: actual === 'dark' ? '/static/icons/logo-white.png' : '/static/icons/logo.png',
          });
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

    onExport() {
      if (!this.data.result) { this.toast('暂无可导出的内容'); return; }
      if (this.data.busy) return;

      withLock('export', async () => {
        this.setData({ busy: true });
        const failText = (A.resultActions && A.resultActions.fail) || '导出失败，请重试';
        try {
          const paths = await uniExport(this, {
            view: this.data.result,
            question: this.data.question,
            dark: this.data.dark,
            meta: A.exportMeta || {},
          });
          if (!paths || !paths.length) { this.toast(failText); return; }
          // 预览里长按即可保存，不需要相册权限
          uni.previewImage({ urls: paths, current: paths[0] });
          if (paths.length > 1) {
            this.toast((A.exportPaging || '内容较长，已分为 %n 张图片').replace('%n', String(paths.length)));
          }
        } catch (e) {
          this.toast(failText);
        } finally {
          this.setData({ busy: false });
        }
      });
    },

    /* ---------------- 刷新恢复 ---------------- */

    /** 冷启动回填：上次结果还在会话里就直接回到结果页 */
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

    openIcp() {
      uni.setClipboardData({
        data: 'https://beian.miit.gov.cn/',
        success: () => this.toast('备案查询地址已复制'),
      });
    },
  },
};
</script>

<style>
/* ================================================================== *
 * 样式：与 theme.css / 小程序 index.wxss 同一套令牌与组件尺寸
 * 单位一律 px（禁 rpx）；不用 ::before / ::after；不用通配选择器。
 * ================================================================== */

/* 一、设计变量 ─────────────────────────────────────────────── */
.nt-page-safe {
  --nt-bg: #ffffff;
  --nt-paper: #f5f5f5;
  --nt-elevated: #ffffff;
  --nt-ink: #000000;
  --nt-text-2: #666666;
  --nt-text-50: rgba(0, 0, 0, 0.6);
  --nt-text-20: rgba(0, 0, 0, 0.56);
  --nt-foot: rgba(0, 0, 0, 0.55);
  --nt-placeholder: #6e6e73;
  --nt-danger: #bf3f12;
  --nt-halo-soft: rgba(0, 0, 0, 0.1);
  --nt-halo-glow: rgba(0, 0, 0, 0.2);

  --r-card: 25px;
  --r-panel: 24px;
  --r-pill: 999px;

  --gutter: 24px;
  --gap: 16px;
  --nav-h: 50px;
  --logo-w: 64.27px;
  --logo-h: 72px;
  --logo-splash-w: 85.69px;
  --logo-splash-h: 96px;
  --pill-h: 48px;
  --pill-w: 272px;
  --row-h: 84px;
  --btn-h: 48px;
  --dual-gap: 48px;
  --modal-w: 354px;
  --modal-h: 184px;
  --modal-btn-h: 44px;
  --modal-btn-gap: 36px;
  --safe-top: 59px;
  --safe-bottom: 34px;
  --halo-gap: 1px;

  --fs-h: 17px;
  --lh-h: 20px;
  --fs-xl: 22px;
  --lh-xl: 26px;
  --fs-splash: 28px;
  --lh-splash: 33px;
  --fs-body-15: 15px;
  --lh-15: 18px;
  --fs-note: 12px;
  --lh-note: 14px;

  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --d-press: 120ms;
  --d-page: 320ms;
  --d-splash: 400ms;
  --d-modal-out: 200ms;

  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: var(--safe-bottom);
  background: var(--nt-bg);
  color: var(--nt-ink);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 16px;
}

/* 二、深色 ─────────────────────────────────────────────────── */
.nt-dark {
  --nt-bg: #000000;
  --nt-paper: #1a1a1a;
  --nt-elevated: #2c2c2e;
  --nt-ink: #ffffff;
  --nt-text-2: #a1a1a1;
  --nt-text-50: rgba(255, 255, 255, 0.68);
  --nt-text-20: rgba(255, 255, 255, 0.5);
  --nt-foot: rgba(255, 255, 255, 0.48);
  --nt-placeholder: rgba(255, 255, 255, 0.48);
  --nt-danger: #ff5733;
  --nt-halo-soft: rgba(255, 255, 255, 0.1);
  --nt-halo-glow: rgba(255, 255, 255, 0.24);
}

/* 三、舞台与视图层 ─────────────────────────────────────────── */
.nt-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  background: var(--nt-bg);
}

.nt-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-sizing: border-box;
  padding-bottom: var(--safe-bottom);
  background: var(--nt-bg);
}

.nt-layer.front { z-index: 3; }
.nt-layer.back { z-index: 1; }

.nt-dim {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  background: #000000;
  opacity: 0;
  pointer-events: none;
}

.nt-dim-in { animation: nt-dim-in var(--d-page) var(--ease-standard) both; }
.nt-dim-out { animation: nt-dim-out var(--d-page) var(--ease-standard) both; }

@keyframes nt-dim-in { from { opacity: 0; } to { opacity: 0.24; } }
@keyframes nt-dim-out { from { opacity: 0.24; } to { opacity: 0; } }
@keyframes nt-px-fwd { from { transform: translateX(0); } to { transform: translateX(-33%); } }
@keyframes nt-px-back { from { transform: translateX(-33%); } to { transform: translateX(0); } }

.nt-tf-in { animation: nt-tf-in var(--d-page) var(--ease-standard) both; }
.nt-tf-out { animation: nt-tf-out var(--d-page) var(--ease-standard) both; }
@keyframes nt-tf-in { from { transform: translateX(100%); } to { transform: none; } }
@keyframes nt-tf-out { from { transform: none; } to { transform: translateX(100%); } }
.nt-px-fwd { animation: nt-px-fwd var(--d-page) var(--ease-standard) both; }
.nt-px-back { animation: nt-px-back var(--d-page) var(--ease-standard) both; }

/* 四、页面骨架 ─────────────────────────────────────────────── */
.home, .res, .ab, .dl {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 五、导航 ─────────────────────────────────────────────────── */
.nt-nav {
  position: relative;
  height: var(--nav-h);
  margin-top: var(--safe-top);
  flex-shrink: 0;
}

.nt-nav-title {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: var(--fs-h);
  line-height: var(--lh-h);
  font-weight: 600;
}

.nt-nav-about {
  position: absolute;
  left: var(--gutter);
  top: 50%;
  transform: translateY(-50%);
  height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  padding: 0 4px;
  font-size: var(--fs-h);
  line-height: var(--lh-h);
  font-weight: 600;
}

.nt-nav-back {
  position: absolute;
  left: var(--gutter);
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

/* 六、页面标题 ─────────────────────────────────────────────── */
.nt-page-h {
  flex-shrink: 0;
  margin-top: 24px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-h);
  line-height: var(--lh-h);
  font-weight: 600;
}

/* 七、图标（背景图；尺寸即旧版几何值） ─────────────────────── */
.nt-icon {
  display: inline-block;
  flex-shrink: 0;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}

.nt-i-back, .nt-i-chev { width: 8.8628px; height: 17.0606px; }
.nt-i-back { background-image: url("/static/icons/icon-back.svg"); }
.nt-i-chev { background-image: url("/static/icons/icon-forward.svg"); }
.nt-i-chev-danger { width: 8.8628px; height: 17.0606px; background-image: url("/static/icons/icon-forward-danger.svg"); }
.nt-i-search { width: 19.7806px; height: 19.5628px; background-image: url("/static/icons/icon-search.svg"); }

.nt-dark .nt-icon { filter: invert(1); }
.nt-dark .nt-i-chev-danger { filter: invert(1) brightness(1.33); }

/* 八、正文容器 ─────────────────────────────────────────────── */
.nt-pgbody {
  flex: 1;
  min-height: 0;
  height: 0;
  padding: 0 var(--gutter) 24px;
  box-sizing: border-box;
}

.nt-pgbody.nt-pt { padding-top: 24px; }

/* 带底部按钮的结果页：正文多留出按钮高度，滚到底时末行不会被按钮压住 */
.res .nt-pgbody { padding-bottom: 72px; }

.nt-dl-card {
  background: var(--nt-paper);
  border-radius: var(--r-card);
  padding: 24px;
  min-height: 100%;
  box-sizing: border-box;
}

.nt-dl-h1 {
  display: block;
  font-size: var(--fs-h);
  line-height: var(--lh-h);
  font-weight: 600;
  margin: 0 0 8px;
}

.nt-dl-h2 {
  display: block;
  font-size: var(--fs-body-15);
  line-height: var(--lh-15);
  font-weight: 400;
  color: var(--nt-ink);
  margin: 0 0 4px;
}

.nt-dl-text {
  display: block;
  font-size: var(--fs-body-15);
  line-height: var(--lh-15);
  color: var(--nt-text-50);
  white-space: pre-wrap;
}

.nt-dl-text-light { color: var(--nt-text-20); }
.nt-dl-item + .nt-dl-item { margin-top: 16px; }
.nt-dl-h2.nt-dl-h1 { font-weight: 600; }

/* 九、首屏 ─────────────────────────────────────────────────── */
.nt-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 var(--gutter) 0;
}

.nt-hero-logo { width: var(--logo-w); height: var(--logo-h); background: var(--nt-bg); }
.nt-hero-title { margin-top: 16px; font-size: var(--fs-xl); line-height: var(--lh-xl); font-weight: 700; }
.nt-hero-note {
  margin-top: 16px;
  font-size: var(--fs-note);
  line-height: var(--lh-note);
  color: var(--nt-foot);
  text-align: center;
}

/* 十、搜索胶囊 ─────────────────────────────────────────────── */
.nt-pill {
  position: relative;
  display: flex;
  align-items: center;
  height: var(--pill-h);
  box-sizing: border-box;
  padding: 0 0 0 24px;
  border-radius: var(--r-pill);
  background: var(--nt-paper);
}

.nt-hero-pill { margin-top: 16px; width: var(--pill-w); max-width: 100%; }

.nt-halo {
  position: absolute;
  left: calc(0px - var(--halo-gap));
  top: calc(0px - var(--halo-gap));
  right: calc(0px - var(--halo-gap));
  bottom: calc(0px - var(--halo-gap));
  border-radius: var(--r-pill);
  pointer-events: none;
  animation: nt-pill-halo 4400ms infinite;
}

@keyframes nt-pill-halo {
  0%, 100% { box-shadow: 0 0 2px 0 var(--nt-halo-soft); }
  50% { box-shadow: 0 0 5px 0 var(--nt-halo-glow); }
}

.nt-pill-input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--fs-h);
  line-height: var(--lh-h);
  color: var(--nt-ink);
}

.nt-ph {
  position: absolute;
  left: 24px;
  right: 48px;
  top: 0;
  height: var(--pill-h);
  overflow: hidden;
  pointer-events: none;
  opacity: 1;
  transition: opacity var(--d-press) var(--ease-standard);
}

.nt-ph-off .nt-ph { opacity: 0; }

.nt-ph-item {
  height: var(--pill-h);
  line-height: var(--pill-h);
  font-size: var(--fs-h);
  color: var(--nt-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nt-pill-search {
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
}

/* 十一、按钮 ───────────────────────────────────────────────── */
.nt-pill-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--btn-h);
  padding: 0 24px;
  border-radius: var(--r-pill);
  background: var(--nt-ink);
  color: var(--nt-bg);
  font-size: var(--fs-h);
  line-height: var(--lh-h);
  font-weight: 600;
}

.nt-pill-btn.ghost { background: var(--nt-paper); color: var(--nt-ink); font-weight: 400; }
.nt-busy { opacity: 0.45; }

.nt-dual {
  display: flex;
  gap: var(--dual-gap);
  flex-shrink: 0;
  padding: 0 var(--gutter) 24px;
}

.nt-dual > view { flex: 1; }

.nt-para { height: 24px; flex-shrink: 0; }

/* 十二、设置卡 ─────────────────────────────────────────────── */
.nt-setlist { display: flex; flex-direction: column; gap: var(--gap); }
.ab-setlist { margin-top: 24px; }

.nt-setrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: var(--row-h);
  padding: 0 24px;
  box-sizing: border-box;
  background: var(--nt-paper);
  border-radius: var(--r-card);
  transition: background var(--d-press) var(--ease-standard);
}

.nt-setl { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.nt-setl-title { font-size: var(--fs-h); line-height: 22px; font-weight: 600; color: var(--nt-ink); }
.nt-setl-desc { font-size: var(--fs-body-15); line-height: var(--lh-15); color: var(--nt-text-50); }
.nt-setrow.danger .nt-setl-title { color: var(--nt-danger); }

/* 十三、品牌区 ─────────────────────────────────────────────── */
.nt-brand { display: flex; flex-direction: column; align-items: center; }
.nt-brand-logo { width: var(--logo-w); height: var(--logo-h); background: var(--nt-bg); }
.nt-brand-name { margin-top: 16px; font-size: var(--fs-xl); line-height: var(--lh-xl); font-weight: 700; }
.nt-brand-sub { margin-top: 16px; font-size: var(--fs-note); line-height: var(--lh-note); color: var(--nt-foot); }

/* 十四、结果页两栏 ─────────────────────────────────────────── */
.res-block { margin-bottom: 12px; }

.res-kvrow { display: flex; align-items: baseline; margin-bottom: 6px; }

.res-kv-label {
  flex: 0 0 64px;
  margin-right: 12px;
  font-size: var(--fs-note);
  line-height: 18px;
  color: var(--nt-foot);
  text-align: right;
  white-space: nowrap;
}

.res-kv-text {
  flex: 1;
  min-width: 0;
  font-size: var(--fs-body-15);
  line-height: var(--lh-15);
  color: var(--nt-text-20);
  word-break: break-all;
}

.res-lead-h { margin-top: 16px; }
.res-section + .res-section { margin-top: 24px; }
.res-section-title { color: var(--nt-text-2); }

.res-tail-note {
  display: block;
  margin-top: 24px;
  font-size: var(--fs-body-15);
  line-height: var(--lh-15);
  color: var(--nt-text-20);
  white-space: pre-wrap;
}

/* 十五、页脚 ───────────────────────────────────────────────── */
.nt-foot { flex-shrink: 0; padding: 0 var(--gutter) 12px; text-align: center; }

.nt-setfoot-line {
  display: block;
  font-size: var(--fs-note);
  line-height: var(--lh-note);
  color: var(--nt-foot);
}

/* 十六、弹窗与轻提示 ───────────────────────────────────────── */
.nt-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.32);
  animation: nt-rise 280ms var(--ease-standard) both;
}

.nt-mask-out { animation: nt-fall var(--d-modal-out) var(--ease-standard) both; pointer-events: none; }

@keyframes nt-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes nt-fall { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(8px); } }

.nt-modal {
  width: 100%;
  max-width: var(--modal-w);
  min-height: var(--modal-h);
  box-sizing: border-box;
  background: var(--nt-elevated);
  border-radius: var(--r-panel);
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.nt-modal-title { display: block; font-size: var(--fs-xl); line-height: var(--lh-xl); font-weight: 700; margin-bottom: 14px; }
.nt-modal-desc { display: block; flex: 1; min-height: 0; margin-bottom: 14px; }
.nt-modal-desc-text { display: block; font-size: var(--fs-body-15); line-height: var(--lh-15); color: var(--nt-text-50); }

.nt-modal-btns { display: flex; gap: var(--modal-btn-gap); margin-top: auto; }
.nt-modal-btns > view { flex: 1; height: var(--modal-btn-h); }

.nt-toast {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 96px;
  z-index: 110;
  margin: 0 auto;
  width: auto;
  max-width: 80%;
  box-sizing: border-box;
  padding: 10px 20px;
  border-radius: var(--r-pill);
  background: var(--nt-ink);
  color: var(--nt-bg);
  font-size: 13px;
  text-align: center;
  animation: nt-rise 200ms var(--ease-standard) both;
}

/* 十七、开屏 ───────────────────────────────────────────────── */
.nt-splash {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--nt-bg);
}

.nt-splash-brand { display: flex; flex-direction: column; align-items: center; }
.nt-splash-logo { width: var(--logo-splash-w); height: var(--logo-splash-h); background: var(--nt-bg); }
.nt-splash-name { margin-top: 16px; font-size: var(--fs-splash); line-height: var(--lh-splash); font-weight: 700; }
.nt-splash-sub { margin-top: 8px; font-size: var(--fs-note); line-height: var(--lh-note); color: var(--nt-foot); }

.nt-splash-out { animation: nt-splash-bg var(--d-splash) var(--ease-standard) both; }
.nt-splash-out .nt-splash-brand { animation: nt-splash-brand-out var(--d-splash) var(--ease-standard) both; }

@keyframes nt-splash-bg { 0%, 55% { opacity: 1; } 100% { opacity: 0; } }
@keyframes nt-splash-brand-out { from { transform: scale(1); opacity: 1; } to { transform: scale(0.75); opacity: 0; } }

/* 十八、冷启动错落入场（只播一次，播完摘类） ───────────────── */
.nt-cascade .nt-hero-logo { animation: nt-rise 320ms var(--ease-standard) backwards; }
.nt-cascade .nt-hero-title { animation: nt-rise 320ms 40ms var(--ease-standard) backwards; }
.nt-cascade .nt-hero-pill { animation: nt-rise 320ms 80ms var(--ease-standard) backwards; }
.nt-cascade .nt-hero-note { animation: nt-rise 320ms 120ms var(--ease-standard) backwards; }
.nt-cascade .nt-page-h { animation: nt-rise 320ms var(--ease-standard) backwards; }
.nt-cascade .nt-dl-card { animation: nt-rise 320ms 40ms var(--ease-standard) backwards; }
.nt-cascade .nt-brand { animation: nt-rise 320ms var(--ease-standard) backwards; }
.nt-cascade .nt-setrow:nth-child(1) { animation: nt-rise 320ms 40ms var(--ease-standard) backwards; }
.nt-cascade .nt-setrow:nth-child(2) { animation: nt-rise 320ms 80ms var(--ease-standard) backwards; }
.nt-cascade .nt-setrow:nth-child(3) { animation: nt-rise 320ms 120ms var(--ease-standard) backwards; }
.nt-cascade .nt-setrow:nth-child(4) { animation: nt-rise 320ms 160ms var(--ease-standard) backwards; }

/* 十九、按压反馈（hover-class 用 nt-hover，与小程序一致） ────── */
.nt-hover { opacity: 0.6; }
.nt-setrow.nt-hover { opacity: 1; transform: scale(0.985); }
.nt-pill-btn.nt-hover { opacity: 0.6; transform: scale(0.97); }
.nt-pill-search.nt-hover { opacity: 0.6; transform: scale(0.88); }
.nt-nav-about.nt-hover, .nt-nav-back.nt-hover { opacity: 0.55; }

/* 二十、导出用画布（移出可视区；不能 display:none，否则画不出来） ─ */
.nt-export-canvas { position: fixed; left: -9999px; top: 0; width: 375px; height: 800px; }
</style>
