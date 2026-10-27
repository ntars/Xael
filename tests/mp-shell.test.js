/**
 * tests/mp-shell.test.js —— 小程序壳的逻辑冒烟（用假的 wx / Page 环境跑真实页面代码）
 *
 * 大白话：小程序没法在 Node 里真渲染，但「点了会怎样」全在 index.js 里。
 *   这里用一套最小假 wx + 假 Page 把页面实例跑起来，验证视图切换、搜索出料、
 *   弹窗闸门、详情页数据、清除数据、主题回执是否符合与 PWA 一致的交互约定。
 *   跑的是 dist/mp-weixin 的产物，所以能连带验出构建转写有没有把代码改坏。
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let passed = 0;
let failed = 0;

// ---- 假 wx ----
const store = new Map();
global.wx = {
  getStorageSync: (k) => (store.has(k) ? store.get(k) : ''),
  setStorageSync: (k, v) => store.set(k, v),
  removeStorageSync: (k) => store.delete(k),
  getStorageInfoSync: () => ({ keys: [...store.keys()] }),
  setBackgroundColor: () => {},
  getSystemInfoSync: () => ({ theme: 'light' }),
  onError: () => {},
  setClipboardData: ({ success }) => success && success(),
  createSelectorQuery: () => ({ in: () => ({ select: () => ({ fields: () => ({ exec: (cb) => cb([null]) }) }) }) }),
};

// ---- 假 Page ----
let def = null;
global.Page = (o) => { def = o; };

// 用 CJS 跑通：把壳里的相对 require 指向 dist
const DIST = join(ROOT, 'dist', 'mp-weixin');
require(join(DIST, 'pages', 'index', 'index.js'));

// 造页面实例：setData 支持 'a.b' 路径，并记录调用
function mkPage() {
  const inst = Object.create(def);
  inst.data = JSON.parse(JSON.stringify(def.data));
  inst.setData = (patch) => {
    for (const k of Object.keys(patch)) {
      if (k.indexOf('.') < 0) { inst.data[k] = patch[k]; continue; }
      const parts = k.split('.');
      let o = inst.data;
      for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
      o[parts[parts.length - 1]] = patch[k];
    }
  };
  return inst;
}

async function run() {
  const p = mkPage();
  const ok = (name, cond, extra) => {
    if (cond) { passed++; return; }
    failed++;
    console.error('✗ ' + name + (extra ? ' → ' + extra : ''));
  };

  p.onLoad();
  ok('启动后视图=home', p.data.view === 'home');
  ok('文案已注入', !!(p.data.txt && p.data.txt.name === '玄玖灵犀'), JSON.stringify(p.data.txt && p.data.txt.name));
  ok('关于页 4 卡', p.data.aboutRows.length === 4, String(p.data.aboutRows.length));
  ok('关于我们 3 卡', p.data.usRows.length === 3, String(p.data.usRows.length));
  ok('首页层=front', p.data.layer.home === 'front');

  // 搜索：排八字
  p.setData({ query: '排八字 1990年6月15日 10点 男' });
  p.onSend();
  await new Promise((r) => setTimeout(r, 300));
  ok('结果有内容', !!(p.data.result && p.data.result.kind === 'single'), JSON.stringify(p.data.result && p.data.result.kind));
  ok('结果块非空', !!(p.data.result && p.data.result.blocks.length > 0), String(p.data.result && p.data.result.blocks.length));
  ok('切到结果页', p.data.view === 'result', p.data.view);
  ok('提问回显', p.data.question.indexOf('排八字') === 0, p.data.question);

  // 多命中
  p.goHome();
  p.setData({ query: '排八字 排六爻 1990年6月15日 10点' });
  p.onSend();
  await new Promise((r) => setTimeout(r, 300));
  ok('多命中=multi', p.data.result && p.data.result.kind === 'multi', JSON.stringify(p.data.result && p.data.result.kind));
  ok('多命中小节数=2', p.data.result && p.data.result.sections.length === 2, String(p.data.result && p.data.result.sections.length));

  // 闸门：缺生辰
  p.goHome();
  p.setData({ query: '排八字' });
  p.onSend();
  await new Promise((r) => setTimeout(r, 200));
  ok('生辰弹窗出现', p.data.modal.show === true);
  ok('生辰弹窗单键', p.data.modal.single === true);
  ok('生辰弹窗标题', p.data.modal.title === '请输入生辰', p.data.modal.title);
  p.closeModal();
  await new Promise((r) => setTimeout(r, 300));
  ok('弹窗已关', p.data.modal.show === false);

  // 导航链路：关于 → 关于我们 → 详情 → 返回
  p.goAbout();
  ok('到关于页', p.data.view === 'about');
  p.onRow({ currentTarget: { dataset: { id: 'us' } } });
  ok('到关于我们', p.data.view === 'us');
  p.onRow({ currentTarget: { dataset: { id: 'studio' } } });
  ok('到详情页', p.data.view === 'detail');
  ok('详情标题=星玖工作室', p.data.detailTitle === '星玖工作室', p.data.detailTitle);
  ok('详情有正文', p.data.detailItems.length > 3, String(p.data.detailItems.length));
  ok('详情返回目标=us', p._detailBack === 'us', p._detailBack);
  p.goDetailBack();
  ok('详情返回关于我们', p.data.view === 'us', p.data.view);

  // 参考文献（长文）
  p.goAbout();
  p.onRow({ currentTarget: { dataset: { id: 'refs' } } });
  ok('参考文献条目数', p.data.detailItems.length === 36, String(p.data.detailItems.length));

  // 清除数据
  p.onRow({ currentTarget: { dataset: { id: 'clear' } } });
  ok('清除弹窗出现', p.data.modal.show === true);
  ok('清除弹窗双键', p.data.modal.single === false);
  p.onModalOk();
  await new Promise((r) => setTimeout(r, 300));
  ok('清除后回首页', p.data.view === 'home', p.data.view);
  ok('清除后结果为空', p.data.result === null);

  // 主题切换
  p.setData({ query: '切换主题' });
  p.onSend();
  await new Promise((r) => setTimeout(r, 300));
  ok('主题切换有回执', !!p.data.toastText, p.data.toastText);
  ok('切完是深色', p.data.dark === true, String(p.data.dark));

  console.log(`mp-shell.test.js: 通过 ${passed} 项，失败 ${failed} 项`);
  return { passed, failed };
}

export { run, passed, failed };
