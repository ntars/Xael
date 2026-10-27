# 部署说明

本项目一份内核、三端外壳。内核在 `src/core/`，与平台无关；三端只负责交互与打包。

## 一、网页版（PWA / EdgeOne）

### 1. 构建

```bash
npm run build:web
```

产物直接写到**仓库根目录**：

```
index.html              # 站点入口
static/                 # app.js / theme.css / sw.js / 图标 / 分享图
core/                   # 内核（ESM，原样拷贝）
shared/                 # 共享层（ESM，原样拷贝）
manifest.webmanifest
offline.html  404.html  robots.txt  sitemap.xml
```

之所以放在根目录而不是 `dist/`：EdgeOne 等静态托管平台连接仓库后，默认识别仓库根目录为站点根，**无需配置构建命令与输出目录即可自动部署**，同时满足「源码即站点」的可审查性。生成物已在 `.gitignore` 中排除，不入库。

### 2. EdgeOne 部署

1. 在 EdgeOne Pages 中新建项目，绑定 GitHub 仓库 `ntars/Xael`；
2. 构建命令留空或填 `npm run build:web`，**输出目录填 `/`（仓库根）**；
3. 绑定自定义域名 `x.ntars.cn`，开启 HTTPS；
4. 若构建命令留空，请先在本地执行 `npm run build:web` 并提交生成物（不推荐，易与源码不同步）。

### 3. 产物一致性

`npm run check` 的第 ② 项会逐文件比对 `src/` 与根目录产物、`dist/mp-weixin/` 与 `src/shells/mp-weixin + src/core`，任何一侧手改都会报错。

## 二、微信小程序

```bash
npm run build:mp
```

产物在 `dist/mp-weixin/`，用微信开发者工具导入该目录即可预览/上传。

- appid：`wx7d40cfd5e4849d0d`（与线上一致，见 `src/shells/mp-weixin/project.config.json`）；
- 构建脚本 `tools/build-mp.js` 把内核 ESM 逐文件转写为 CommonJS（含 `export * from` 的重导出展开、相对路径补 `.js`），并拷贝手写壳；
- 构建后自动校验：文件数、总体积、每个文件的 `require` 路径可解析。

### 单位处理（px 与 rpx）

全项目源码**只写 px / rem，不写 rpx**。三端各自处理小程序与手机的尺寸差异：

- PWA 与小程序 WXSS 共用同一套 CSS 变量与类名，值全部为 px；响应式由媒体查询完成（<360px 满宽 / 360–767 设计稿 / 768–1023 居中 640 / ≥1024 居中 720），字号恒定不缩放；
- 小程序原生端（`src/shells/mp-weixin`）的 WXSS 与 PWA 同源，写入同样 px 值。微信运行时会按屏幕宽度做等比映射，本项目不做二次换算，也不手写 rpx；
- uni-app 端（`src/shells/uniapp`）保留作者书写的 px 值，由 uni-app 官方编译器在构建期换算，`pages.json` 不启用任何额外的尺寸换算配置。

因此三端只有一份设计值（`src/shells/pwa/static/theme.css` 中的变量表），源码层面不会出现 rpx。

## 三、uni-app

```bash
# 用 HBuilderX 或 CLI 导入 src/shells/uniapp（产物由 HBuilderX 生成，不入库）
# 入库校验：
node tools/build-uni.js
```

- `src/shells/uniapp/manifest.json` 中 `mp-weixin.appid` 与小程序端一致；
- 页面 `pages/index/index.vue` 复用 `src/core` 与 `src/shared`，不重复实现任何算法；
- 样式与 PWA 同源（px），不使用 rpx；
- 导出走 `export-uni.js`（canvas 2d → `uni.canvasToTempFilePath` → `uni.previewImage` 长按保存，零相册权限）；
- `tools/preflight.js` 第 ⑧ 项会校验三壳引用一致（uni-app 壳导入的具名导出必须真实存在）。

## 四、本地开发

```bash
npm test          # 133 项断言，Node 直跑，无测试框架
npm run build     # 网页 + 小程序
npm run check     # 八项发布自检
python3 -m http.server 8080   # 起本地静态服务预览网页版
```

Service Worker 需要 HTTPS 或 `localhost`；直接用 `file://` 打开会跳过离线缓存。
