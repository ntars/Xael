/**
 * src/shared/export-image.js —— 结果页导出长图（Canvas 镜像排版，2 倍图）
 *
 * 大白话：把结果页排版原样画到离屏 Canvas 上导出 PNG。
 * 铁律：
 *   · EXPORT_DPR = 2（清晰度）；
 *   · 画布上限：单页面积 ≤ 16,777,216px²、单边 ≤ 8192px → 内容宽 ≤ 4096 逻辑 pt；
 *   · 超长内容自动分页：「(接上页)」+「第 i/n 张」；
 *   · 右下角两张位图（小程序码/公众号码），小程序端用 wx.previewImage 零权限预览。
 * 小程序端 Canvas API 不同，适配点在 platform.js。
 */

export const EXPORT_DPR = 2;
export const AREA_LIMIT = 16777216; // 4096²
export const SIDE_LIMIT = 8192;

/** 分页计算：给定内容高（逻辑 pt）与每页可用高，返回页数与每页起始行 */
export function paginate(contentHeight, pageHeight) {
  const pages = Math.ceil(contentHeight / pageHeight);
  const out = [];
  for (let i = 0; i < pages; i++) out.push({ index: i + 1, total: pages, top: i * pageHeight });
  return out;
}

/**
 * 检查画布是否越限。
 * @returns {boolean} 越限 true
 */
export function overflow(w, h) {
  return w * h > AREA_LIMIT || w > SIDE_LIMIT || h > SIDE_LIMIT;
}
