// 由 tools/build-mp.js 自 src/shared/settings.js 生成，请勿手改
/**
 * src/shared/settings.js —— 设置单一真源（主题/口径/文案）
 *
 * 大白话：所有「可配置的文案与开关」只在这一处：
 *   · 品牌/页脚/声明文案（详情页 5 子页共用）；
 *   · 主题（跟随系统 / 浅色 / 深色，手动优先系统）；
 *   · 口径开关（八字换日子时口径等）。
 * 小程序与 PWA 都从这里取值，保证逐字同源。
 */

const SETTINGS = {
  version: '5.0.0',
  slogan: '玄之又玄，众妙之门。',
  brand: '玄玖灵犀 Xael',
  studio: '星玖工作室 Ntarstudio',
  icp: '蜀ICP备2026027050号',
  copyright: '© 2024-2026 Ntarstudio',
  site: 'https://x.ntars.cn/',
  disclaimer: '内容仅供交流学习',
  searchPlaceholder: '今天想了解点什么',
  pages: {
    about: {
      title: '关于',
      cards: [
        { id: 'refs', label: '参考文献' },
        { id: 'features', label: '功能介绍' },
        { id: 'studio', label: '关于我们' },
        { id: 'clear', label: '清除数据', danger: true },
      ],
    },
    studio: {
      title: '关于我们',
      cards: [
        { id: 'protocol', label: '协议条款' },
        { id: 'oss', label: '开源声明' },
        { id: 'intro', label: '功能介绍' },
      ],
    },
  },
  theme: {
    default: 'system', // system | light | dark（手动优先系统）
  },
  caliber: {
    baziSect: 'ziChu', // 子初换日（默认）；可切 ziZheng
  },
};

/** 主题关键词（搜索「切换主题/深色模式」直接生效） */
const THEME_KEYWORDS = [
  { words: ['深色模式', '夜间模式', '切换深色'], value: 'dark' },
  { words: ['浅色模式', '日间模式', '切换浅色'], value: 'light' },
  { words: ['跟随系统', '切换主题'], value: 'system' },
];

/** 设置读写（走 storage） */
const { storage } = require('./storage.js');

function getTheme() {
  return storage.get('theme', SETTINGS.theme.default);
}

function setTheme(v) {
  if (!['system', 'light', 'dark'].includes(v)) return false;
  storage.set('theme', v);
  return true;
}

function getBaziSect() {
  return storage.get('baziSect', SETTINGS.caliber.baziSect);
}


module.exports.getTheme = getTheme;
module.exports.setTheme = setTheme;
module.exports.getBaziSect = getBaziSect;
module.exports.SETTINGS = SETTINGS;
module.exports.THEME_KEYWORDS = THEME_KEYWORDS;
