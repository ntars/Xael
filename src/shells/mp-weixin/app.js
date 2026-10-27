// pages/app.js —— 小程序入口：注入 storage 驱动 + 主题 + 全局错误守卫
const { setStorageDriver } = require('./src/shared/storage.js');
const { applyTheme, getTheme } = require('./theme-mp.js');

App({
  onLaunch() {
    // 小程序 storage 驱动（与 PWA 同一套三承诺策略，只在平台层换实现）
    setStorageDriver({
      getItem(k) { try { return wx.getStorageSync(k) || null; } catch (e) { return null; } },
      setItem(k, v) { try { wx.setStorageSync(k, v); } catch (e) { /* 写不抛 */ } },
      removeItem(k) { try { wx.removeStorageSync(k); } catch (e) { /* 删不抛 */ } },
      keys() { try { return wx.getStorageInfoSync().keys || []; } catch (e) { return []; } },
    });

    applyTheme(getTheme());

    // 全局错误：只记消息，不吞错、不泄堆栈
    wx.onError((msg) => {
      try {
        const k = 'xael_guard';
        const list = wx.getStorageSync(k) || [];
        list.push({ at: Date.now(), msg: String(msg).slice(0, 200) });
        wx.setStorageSync(k, list.slice(-20));
      } catch (e) { /* 守卫自身绝不抛 */ }
    });
  },
});
