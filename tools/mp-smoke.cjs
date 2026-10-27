// 模拟小程序运行环境，require 首页 page 逻辑并跑搜索流程
const path = require('path');
const store = {};
global.wx = {
  getStorageSync(k){ return store[k] ?? ''; }, setStorageSync(k,v){ store[k]=v; },
  removeStorageSync(k){ delete store[k]; }, getStorageInfoSync(){ return { keys: Object.keys(store) }; },
  setBackgroundColor(){}, getSystemInfoSync(){ return { theme: 'light' }; }, onError(){},
};
global.App = (o) => { global.__app = o; };
let pageDef = null;
global.Page = (o) => { pageDef = o; };

const root = path.resolve(__dirname,'..','dist','mp-weixin');
require(path.join(root, 'app.js'));
require(path.join(root, 'pages/index/index.js'));

// 造一个 page 实例
const inst = Object.create(pageDef);
inst.data = JSON.parse(JSON.stringify(pageDef.data));
inst.setData = function (patch) {
  for (const k in patch) {
    if (k.includes('.')) { const [a,b]=k.split('.'); this.data[a][b]=patch[k]; }
    else this.data[k] = patch[k];
  }
};
inst.onLoad();
setTimeout(async () => {
  inst.onInput({ detail: { value: '排八字 1990年6月15日 10点' } });
  inst.onSearch();
  await new Promise(r => setTimeout(r, 200));
  const r = inst.data.result;
  console.log('结果渲染:', r ? r.sections[0].title + ' / 块数 ' + r.sections[0].blocks.length + ' / 首块行数 ' + r.sections[0].blocks[0].rows.length : '无');
  inst.goAbout(); console.log('关于卡:', inst.data.aboutCards.map(c=>c.label).join(' '));
  inst.onAboutCard({ currentTarget: { dataset: { id: 'clear' } } });
  console.log('弹窗:', inst.data.modal.text);
  inst.onModalOk(); console.log('弹窗关闭:', inst.data.modal.show === false);
}, 100);
