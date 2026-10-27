<!--
  pages/index/index.vue —— uni-app 单页壳（与 PWA/小程序同构）
  UI 与交互按设计稿：开屏 → 首页搜索 → 结果 → 关于 → 关于我们 → 详情 → 弹窗。
  样式用 px（禁 rpx），与 theme.css 令牌一致。
-->
<template>
  <view class="nt-page" :class="{ 'nt-dark': dark }">
    <!-- 开屏 -->
    <view v-if="splash" class="nt-splash">
      <view class="nt-splash-inner">
        <image class="nt-splash-logo" src="/static/logo.png" mode="aspectFit" />
        <view class="nt-splash-name">玄玖灵犀</view>
        <view class="nt-splash-slogan">演乾坤 · 知天命</view>
      </view>
    </view>

    <!-- 首页 -->
    <view v-if="view === 'home'" class="nt-view">
      <view class="nt-top"><text class="nt-btn-text" @tap="goAbout">关于</text></view>

      <view v-if="!result" class="nt-home-empty">
        <image class="nt-home-logo" src="/static/logo.png" mode="aspectFit" />
        <view class="nt-home-name">玄玖灵犀</view>
        <view class="nt-search">
          <view class="nt-halo"></view>
          <input class="nt-search-input" v-model="query" :placeholder="placeholder" confirm-type="search" @confirm="onSearch" />
        </view>
        <text class="nt-disclaimer">{{ disclaimer }}</text>
      </view>

      <view v-else class="nt-result">
        <view v-for="(sec, si) in result.sections" :key="si" class="nt-section">
          <view class="nt-result-title">{{ sec.title }}</view>
          <view v-if="sec.lead" class="nt-result-lead">{{ sec.lead }}</view>
          <view v-for="(blk, bi) in sec.blocks" :key="bi" class="nt-block">
            <view class="nt-block-title">{{ blk.title }}</view>
            <view v-for="(row, ri) in blk.rows" :key="ri" class="nt-row" :class="{ 'nt-row-full': !row.pair }">
              <text class="nt-row-label">{{ row.label }}</text>
              <text class="nt-row-value">{{ row.value }}</text>
            </view>
          </view>
        </view>
        <view class="nt-search nt-search-inline">
          <input class="nt-search-input" v-model="query" :placeholder="placeholder" confirm-type="search" @confirm="onSearch" />
        </view>
      </view>

      <view class="nt-footer">
        <text>{{ footer.icp }}</text>
        <text>{{ footer.copyright }}</text>
      </view>
    </view>

    <!-- 关于页 -->
    <view v-else-if="view === 'about'" class="nt-view">
      <view class="nt-page-head"><text class="nt-btn-back" @tap="goHome">‹</text><view class="nt-page-title">关于</view></view>
      <view class="nt-cards">
        <view v-for="c in aboutCards" :key="c.id" class="nt-card" :class="{ 'nt-card-danger': c.danger }" @tap="onAboutCard(c.id)">
          <text>{{ c.label }}</text><text class="nt-card-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 关于我们 -->
    <view v-else-if="view === 'studio'" class="nt-view">
      <view class="nt-page-head"><text class="nt-btn-back" @tap="goAbout">‹</text><view class="nt-page-title">关于我们</view></view>
      <view class="nt-cards">
        <view v-for="c in studioCards" :key="c.id" class="nt-card" @tap="openDoc(c.id)">
          <text>{{ c.label }}</text><text class="nt-card-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 详情页 -->
    <view v-else-if="view === 'doc' && doc" class="nt-view">
      <view class="nt-page-head"><text class="nt-btn-back" @tap="goAbout">‹</text><view class="nt-page-title">{{ doc.title }}</view></view>
      <view class="nt-doc-body">
        <view v-for="(p, i) in doc.body" :key="i" class="nt-doc-p">{{ p }}</view>
      </view>
    </view>

    <!-- 弹窗 -->
    <view v-if="modal.show" class="nt-modal">
      <view class="nt-modal-mask" @tap="closeModal"></view>
      <view class="nt-modal-card">
        <view class="nt-modal-text">{{ modal.text }}</view>
        <view class="nt-modal-actions">
          <view class="nt-modal-btn" @tap="closeModal">取消</view>
          <view class="nt-modal-btn" :class="{ 'nt-modal-danger': modal.danger }" @tap="onModalOk">确认</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { analyze } from '../../../core/features/analyzer.js';
import { buildResultView, blockTitle, isPairRow, flattenRows } from '../../../shared/result-format.js';
import { SETTINGS, getTheme, setTheme } from '../../../shared/settings.js';
import { REFS, REFS_NOTE } from '../../../shared/refs.js';
import { storage } from '../../../shared/storage.js';
import { run as withLock } from '../../../shared/inflight.js';
import { applyTheme } from '../../../shared/theme.js';

const DOCS = {
  protocol: {
    title: '协议条款',
    body: [
      `${SETTINGS.brand} 为传统文化学习与研究辅助工具。使用本工具即表示你已知悉并同意以下条款。`,
      '使用范围：输出为传统术数规则的机械推演结果，不含预测承诺，' + SETTINGS.disclaimer + '。',
      '数据与隐私：全部演算在设备本地完成，不上传任何数据；本地数据可随时通过「清除数据」删除。',
      '知识产权：代码以 AGPL-3.0 开源；品牌名称、界面与视觉设计归 ' + SETTINGS.studio + ' 所有。',
    ],
  },
  oss: {
    title: '开源声明',
    body: [
      '本项目以 AGPL-3.0 协议开源，仓库 ntars/Xael。全部算法均为本项目自研实现，所参考的公开算法思想与数据来源在 NOTICE 与 README 中逐一声明。',
      '参考文献：' + REFS.map((r) => r.书名 + r.作者).join('；'),
      REFS_NOTE,
    ],
  },
  features: {
    title: '功能介绍',
    body: [
      '在搜索框输入一句话即可，例如「排八字 1990年6月15日 10点」「今日黄历」「排奇门」。',
      '支持的问法：国历生辰 1990年6月15日 10点；农历生辰 农历1990年五月廿四；四柱 庚午年 壬午月 辛亥日 癸巳时。',
    ],
  },
  refs: {
    title: '参考文献',
    body: REFS.map((r) => `${r.书名} ${r.作者}（${r.用途}）`).concat([REFS_NOTE]),
  },
  intro: {
    title: '星玖工作室',
    body: [SETTINGS.studio + '，专注传统文化数字化整理与工具化呈现。', '官网：' + SETTINGS.site, SETTINGS.icp + ' · ' + SETTINGS.copyright],
  },
};

export default {
  data() {
    return {
      splash: true,
      view: 'home',
      query: '',
      result: null,
      doc: null,
      modal: { show: false, text: '', danger: false },
      dark: getTheme() === 'dark',
      aboutCards: SETTINGS.pages.about.cards,
      studioCards: SETTINGS.pages.studio.cards,
      footer: { icp: SETTINGS.icp, copyright: SETTINGS.copyright },
      disclaimer: SETTINGS.disclaimer,
      placeholder: SETTINGS.searchPlaceholder,
    };
  },
  onLoad() {
    setTimeout(() => { this.splash = false; }, 1200);
  },
  methods: {
    async onSearch() {
      const q = (this.query || '').trim();
      if (!q) return;
      const r = await withLock('search', () => analyze(q));
      if (!r) return;
      if (r.type === 'theme') {
        setTheme(r.value);
        applyTheme(r.value);
        this.dark = r.value === 'dark';
        return;
      }
      if (r.type === 'refuse') { this.openModal(r.message); return; }
      const view = buildResultView(r.results);
      const sections = view.kind === 'single' ? [view] : view.sections;
      this.result = {
        sections: sections.map((s) => ({
          title: s.title,
          lead: s.lead || '',
          blocks: (s.blocks || []).map((b) => ({
            title: blockTitle(b),
            rows: flattenRows(b.数据 || {})
              .filter((x) => !x.group)
              .map((x) => ({ label: x.label, value: x.value, pair: isPairRow(x.label, x.value) })),
          })),
        })),
      };
      storage.set('lastQuery', q);
    },
    goAbout() { this.view = 'about'; },
    goHome() { this.view = 'home'; },
    onAboutCard(id) {
      if (id === 'clear') { this.openModal('确认清除全部本地数据？', true); return; }
      if (id === 'studio') { this.view = 'studio'; return; }
      this.openDoc(id);
    },
    openDoc(id) {
      const d = DOCS[id];
      if (!d) return;
      this.doc = d;
      this.view = 'doc';
    },
    openModal(text, danger) { this.modal = { show: true, text, danger: !!danger }; },
    closeModal() { this.modal.show = false; },
    onModalOk() {
      if (this.modal.danger) storage.clearAll();
      this.closeModal();
    },
  },
};
</script>

<style>
/* 与 PWA theme.css 同源的 px 令牌（禁 rpx）；uni-app 端由编译器处理小程序换算 */
.nt-page { --nt-paper: #ffffff; --nt-elevated: #f5f5f7; --nt-ink: #1a1a1a; --nt-ink-2: #6e6e73; --nt-hairline: rgba(0,0,0,0.08); --nt-danger: #d70015;
  min-height: 100vh; background: var(--nt-paper); color: var(--nt-ink); font-size: 15px; }
.nt-dark { --nt-paper: #1a1a1a; --nt-elevated: #2c2c2e; --nt-ink: #f5f5f7; --nt-ink-2: #98989d; --nt-hairline: rgba(255,255,255,0.10); --nt-danger: #ff453a; }
.nt-splash { position: fixed; left: 0; top: 0; right: 0; bottom: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: var(--nt-paper); }
.nt-splash-inner { display: flex; flex-direction: column; align-items: center; }
.nt-splash-logo { width: 86px; height: 96px; }
.nt-splash-name { margin-top: 16px; font-size: 28px; letter-spacing: 2px; font-weight: 500; }
.nt-splash-slogan { margin-top: 8px; font-size: 12px; color: var(--nt-ink-2); letter-spacing: 1px; }
.nt-view { min-height: 100vh; box-sizing: border-box; padding: 16px 16px 24px; background: var(--nt-paper); }
.nt-top { display: flex; justify-content: flex-start; min-height: 32px; }
.nt-btn-text { font-size: 13px; color: var(--nt-ink-2); }
.nt-home-empty { display: flex; flex-direction: column; align-items: center; padding-top: 18vh; }
.nt-home-logo { width: 64px; height: 72px; }
.nt-home-name { margin: 12px 0 32px; font-size: 22px; font-weight: 500; letter-spacing: 1px; }
.nt-search { position: relative; display: flex; align-items: center; width: 272px; height: 48px; box-sizing: border-box; padding: 0 16px; border-radius: 24px; background: var(--nt-elevated); }
.nt-search-inline { width: 100%; margin-top: 24px; }
.nt-halo { position: absolute; left: -1px; top: -1px; right: -1px; bottom: -1px; border-radius: 25px; box-shadow: 0 0 12px 2px var(--nt-hairline); }
.nt-search-input { flex: 1 1 auto; font-size: 15px; color: var(--nt-ink); }
.nt-disclaimer { margin-top: 24px; font-size: 11px; color: var(--nt-ink-2); }
.nt-result { padding-top: 24px; }
.nt-result-title { font-size: 17px; font-weight: 500; margin-bottom: 8px; }
.nt-result-lead { font-size: 13px; color: var(--nt-ink-2); line-height: 1.6; margin-bottom: 16px; }
.nt-block { padding: 12px 0; border-top: 1px solid var(--nt-hairline); }
.nt-block-title { font-size: 13px; color: var(--nt-ink-2); font-weight: 500; margin-bottom: 8px; }
.nt-row { display: flex; align-items: baseline; min-height: 28px; font-size: 15px; line-height: 1.6; }
.nt-row-label { flex: 0 0 64px; color: var(--nt-ink-2); font-size: 13px; }
.nt-row-value { flex: 1 1 auto; word-break: break-all; }
.nt-row-full { flex-direction: column; }
.nt-footer { display: flex; flex-direction: column; align-items: center; margin-top: 48px; padding-bottom: 16px; font-size: 11px; color: var(--nt-ink-2); }
.nt-page-head { display: flex; align-items: center; min-height: 44px; }
.nt-btn-back { font-size: 24px; color: var(--nt-ink); padding: 0 8px 4px 0; }
.nt-page-title { font-size: 17px; font-weight: 500; }
.nt-cards { margin-top: 12px; display: flex; flex-direction: column; }
.nt-card { display: flex; align-items: center; justify-content: space-between; min-height: 44px; padding: 12px 0; border-bottom: 1px solid var(--nt-hairline); font-size: 15px; color: var(--nt-ink); }
.nt-card-danger { color: var(--nt-danger); }
.nt-card-arrow { color: var(--nt-ink-2); }
.nt-doc-body { margin-top: 12px; font-size: 15px; line-height: 1.8; }
.nt-doc-p { margin-bottom: 8px; }
.nt-modal { position: fixed; left: 0; top: 0; right: 0; bottom: 0; z-index: 200; display: flex; align-items: center; justify-content: center; }
.nt-modal-mask { position: absolute; left: 0; top: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.35); }
.nt-modal-card { position: relative; width: 354px; max-width: calc(100vw - 32px); min-height: 184px; box-sizing: border-box; border-radius: 24px; background: var(--nt-elevated); padding: 24px; display: flex; flex-direction: column; justify-content: space-between; }
.nt-modal-text { font-size: 15px; line-height: 1.7; text-align: center; }
.nt-modal-actions { display: flex; margin-top: 16px; }
.nt-modal-btn { flex: 1 1 0; text-align: center; border-radius: 999px; min-height: 44px; line-height: 44px; background: var(--nt-paper); color: var(--nt-ink); font-size: 15px; margin-left: 12px; }
.nt-modal-btn:first-child { margin-left: 0; }
.nt-modal-danger { color: var(--nt-danger); }
</style>
