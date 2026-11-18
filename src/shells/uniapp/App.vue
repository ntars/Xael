<!--
  src/shells/uniapp/App.vue —— uni-app 入口（微信小程序/其他端并行形态）
  说明：uni-app 端与 PWA/小程序共用同一套 core 与 shared 模块；
  样式沿用 theme.css 的 px/rem 令牌（禁 rpx），小程序端由 uni-app 编译器自动换算。
-->
<script>
import { setStorageDriver } from '../../shared/storage.js';
import { getTheme } from '../../shared/settings.js';
import { resolveTheme } from './theme-uni.js';

export default {
  onLaunch() {
    // uni-app storage 驱动
    setStorageDriver({
      getItem(k) {
        try { const v = uni.getStorageSync(k); return v === '' || v == null ? null : v; } catch (e) { return null; }
      },
      setItem(k, v) { try { uni.setStorageSync(k, v); } catch (e) { /* 写不抛 */ } },
      removeItem(k) { try { uni.removeStorageSync(k); } catch (e) { /* 删不抛 */ } },
      keys() { try { return uni.getStorageInfoSync().keys || []; } catch (e) { return []; } },
    });
    resolveTheme(getTheme());
  },
};
</script>

<style>
/* 全局样式：与 PWA theme.css 同源（此处只放 uni-app 需要的全局重置，详见 static/theme.css） */
page {
  background: #ffffff;
  color: #1a1a1a;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif;
}
</style>
