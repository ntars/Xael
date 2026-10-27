// pages/index/index.js —— 首页（五视图单页壳：首页/结果/关于/关于我们/详情）
const { analyze } = require('../../src/core/features/analyzer.js');
const { buildResultView, blockTitle, isPairRow, flattenRows } = require('../../src/shared/result-format.js');
const { SETTINGS, getTheme, setTheme } = require('../../src/shared/settings.js');
const { REFS, REFS_NOTE } = require('../../src/shared/refs.js');
const { storage } = require('../../src/shared/storage.js');
const { run: withLock } = require('../../src/shared/inflight.js');
const { applyTheme } = require('../../theme-mp.js');

// 详情页文案（与 PWA 同一份单一真源：settings/refs）
const DOCS = {
  protocol: { title: '协议条款', body: [
    `${SETTINGS.brand} 为传统文化学习与研究辅助工具。使用本工具即表示你已知悉并同意以下条款。`,
    '使用范围：输出为传统术数规则的机械推演结果，不含预测承诺，' + SETTINGS.disclaimer + '。',
    '数据与隐私：全部演算在设备本地完成，不上传任何数据；本地数据可随时通过「清除数据」删除。',
    '知识产权：代码以 AGPL-3.0 开源；品牌名称、界面与视觉设计归 ' + SETTINGS.studio + ' 所有。',
  ] },
  oss: { title: '开源声明', body: [
    '本项目以 AGPL-3.0 协议开源，仓库 ntars/Xael。全部算法均为本项目自研实现，所参考的公开算法思想与数据来源在 NOTICE 与 README 中逐一声明。',
    '参考文献：' + REFS.map((r) => r.书名 + r.作者).join('；'),
    REFS_NOTE,
  ] },
  features: { title: '功能介绍', body: [
    '在搜索框输入一句话即可，例如「排八字 1990年6月15日 10点」「今日黄历」「排奇门」。',
    '支持的问法：国历生辰 1990年6月15日 10点；农历生辰 农历1990年五月廿四；四柱 庚午年 壬午月 辛亥日 癸巳时。',
  ] },
  refs: { title: '参考文献', body: REFS.map((r) => r.书名 + ' ' + r.作者 + '（' + r.用途 + '）').concat([REFS_NOTE]) },
  intro: { title: '星玖工作室', body: [
    SETTINGS.studio + '，专注传统文化数字化整理与工具化呈现。',
    '官网：' + SETTINGS.site,
    SETTINGS.icp + ' · ' + SETTINGS.copyright,
  ] },
};

Page({
  data: {
    splash: true,
    view: 'home',          // home | about | studio | doc
    query: '',
    result: null,          // { kind, title, blocks } 或 { kind:'multi', sections }
    aboutCards: SETTINGS.pages.about.cards,
    studioCards: SETTINGS.pages.studio.cards,
    doc: null,
    modal: { show: false, text: '', danger: false },
    dark: false,
    footer: { icp: SETTINGS.icp, copyright: SETTINGS.copyright },
    disclaimer: SETTINGS.disclaimer,
    placeholder: SETTINGS.searchPlaceholder,
  },

  onLoad() {
    this.setData({ dark: getTheme() === 'dark' });
    // 开屏：停 1.2s 后淡出交接
    setTimeout(() => this.setData({ splash: false }), 1200);
  },

  onInput(e) { this.setData({ query: e.detail.value }); },

  onSearch() {
    const q = (this.data.query || '').trim();
    if (!q) return;
    withLock('search', async () => {
      const r = await analyze(q);
      if (!r) return;
      if (r.type === 'theme') {
        setTheme(r.value);
        applyTheme(r.value);
        this.setData({ dark: r.value === 'dark' });
        return;
      }
      if (r.type === 'refuse') { this.openModal(r.message); return; }
      const view = buildResultView(r.results);
      // 预渲染成纯数据，WXML 只负责画（避免 WXML 里做计算）
      const sections = view.kind === 'single' ? [view] : view.sections;
      const rendered = sections.map((s) => ({
        title: s.title,
        lead: s.lead || '',
        blocks: (s.blocks || []).map((b) => ({
          title: blockTitle(b),
          rows: flattenRows(b.数据 || {}).filter((x) => !x.group).map((x) => ({ label: x.label, value: x.value, pair: isPairRow(x.label, x.value) })),
        })),
      }));
      this.setData({ result: { sections: rendered }, view: 'home' });
      storage.set('lastQuery', q);
    }).catch(() => this.openModal('出了点小问题，请重试。'));
  },

  goAbout() { this.setData({ view: 'about' }); },
  goHome() { this.setData({ view: 'home' }); },
  goStudio() { this.setData({ view: 'studio' }); },
  onAboutCard(e) {
    const id = e.currentTarget.dataset.id;
    if (id === 'clear') { this.openModal('确认清除全部本地数据？', true); return; }
    if (id === 'studio') { this.goStudio(); return; }
    this.openDoc(id);
  },
  onStudioCard(e) { this.openDoc(e.currentTarget.dataset.id); },
  openDoc(id) {
    const d = DOCS[id];
    if (!d) return;
    this.setData({ doc: d, view: 'doc' });
  },
  openModal(text, danger) {
    this.setData({ modal: { show: true, text, danger: !!danger } });
  },
  closeModal() { this.setData({ 'modal.show': false }); },
  onModalOk() {
    if (this.data.modal.danger) storage.clearAll();
    this.closeModal();
  },
});
