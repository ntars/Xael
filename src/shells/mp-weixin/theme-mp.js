// theme-mp.js —— 小程序端主题（深色 = 页面挂 nt-dark 类 + wx.setBackgroundColor）
const { getTheme } = require('./src/shared/settings.js');

function applyTheme(mode) {
  let dark = mode === 'dark';
  if (mode === 'system') {
    try {
      const info = wx.getSystemInfoSync();
      dark = info.theme === 'dark';
    } catch (e) { dark = false; }
  }
  try {
    wx.setBackgroundColor({ backgroundColor: dark ? '#000000' : '#ffffff', backgroundColorTop: dark ? '#000000' : '#ffffff', backgroundColorBottom: dark ? '#000000' : '#ffffff' });
  } catch (e) { /* 低版本不支持则忽略 */ }
  return dark ? 'dark' : 'light';
}

module.exports = { applyTheme, getTheme };
