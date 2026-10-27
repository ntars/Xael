/**
 * src/shared/export-metrics.js —— 导出长图的硬上限与清晰度
 *
 * 单独成文件的原因：画布上限是「事实常量」，网页版、小程序、uni-app 与测试都要读；
 * 放在 export-image.js 里会引入绘制逻辑（小程序端无 document），壳层只读常量时会被拖下水。
 */

/** 导出清晰度：逻辑尺寸 × 2 = 像素尺寸（字才不糊） */
export const EXPORT_DPR = 2;

/** 画布面积上限（4096 × 4096）：超过 iOS / 微信的位图上限会直接空白 */
export const AREA_LIMIT = 16777216;

/** 画布单边上限 */
export const SIDE_LIMIT = 8192;

/** 导出单页最大逻辑高（按 375pt 宽计算，再受单边上限约束） */
export const MAX_PAGE_HEIGHT = Math.min(
  Math.floor(AREA_LIMIT / (375 * EXPORT_DPR * EXPORT_DPR)),
  Math.floor(SIDE_LIMIT / EXPORT_DPR),
);
