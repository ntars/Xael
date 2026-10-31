/**
 * src/shells/uniapp/export-uni.js —— uni-app 端导出适配层
 *
 * 大白话：排版规则全在 src/shared/export-image.js（三端同一份），
 *   这里只负责 uni-app 特有的两件事：
 *     ① 用 uni.createCanvasContext('exportCanvas', this) 拿到画布上下文；
 *     ② 逐页 uni.canvasToTempFilePath 出临时文件，交给 uni.previewImage 长按保存。
 *
 * 注意：uni 的旧式 canvas 上下文（createCanvasContext）不支持 measureText，
 *   所以折行宽度改用一个「按字符宽度估算」的量尺代替实测——中英文都按
 *   字形宽近似（中文 1em、英文 0.55em），误差不会跨行错位，只会让行稍微短一点。
 */

import {
  planLines, layoutRows, paginate, drawPage, maxPageHeight, LAYOUT,
} from '../../shared/export-image.js';
import { EXPORT_DPR } from '../../shared/export-metrics.js';

/** 导出配色跟着当前深浅色走（画布不认 CSS 变量，值要写死） */
export function colorsOf(dark) {
  return dark
    ? { bg: '#000000', ink: '#ffffff', muted: 'rgba(255,255,255,.5)', foot: 'rgba(255,255,255,.48)', muted2: '#a1a1a1' }
    : { bg: '#ffffff', ink: '#000000', muted: 'rgba(0,0,0,.56)', foot: 'rgba(0,0,0,.55)', muted2: '#666666' };
}

/**
 * 量尺替身：只实现 measureText，按字形宽近似。
 * 中文（含全角标点）算 1em，ASCII 算 0.55em，其余按 0.9em。
 */
export function makeRuler(size) {
  const em = size;
  return {
    font: '',
    measureText(text) {
      let w = 0;
      for (const ch of String(text)) {
        const code = ch.codePointAt(0);
        if (code > 0x2e80) w += em;            // CJK 与全角
        else if (code >= 0x20 && code < 0x7f) w += em * 0.55;
        else w += em * 0.9;
      }
      return { width: w };
    },
  };
}

/**
 * 绘制一页：把公用的 drawPage 落到 uni 画布上。
 * uni 的上下文对象与标准 CanvasRenderingContext2D 基本同形，
 * 只是绘制命令要先攒在队列里、最后统一 ctx.draw()。
 */
function paintPage(ctx, opts) {
  drawPage(ctx, opts);
  ctx.draw();
}

/** 把画布导成临时文件 */
function toTempFile(canvasId, page, width, height) {
  return new Promise((resolve, reject) => {
    uni.canvasToTempFilePath({
      canvasId,
      x: 0,
      y: 0,
      width,
      height,
      destWidth: width * EXPORT_DPR,
      destHeight: height * EXPORT_DPR,
      success: (r) => resolve(r.tempFilePath),
      fail: reject,
    }, page);
  });
}

/**
 * 导出主流程。
 * @param {object} page 页面实例（小程序的画布要按页取）
 * @param {{view:object, question:string, dark:boolean, meta:object}} opt
 * @returns {Promise<string[]>} 临时文件路径数组
 */
export async function uniExport(page, opt) {
  const canvasId = 'exportCanvas';
  const meta = opt.meta || {};

  // 交给排版器的完整视图：提问 → 结果 → 附注，与结果页同序
  const src = {
    question: opt.question || '',
    questionLabel: meta.questionLabel || '你的提问',
    title: meta.resultLabel || '玄玖灵犀推演结果：',
    lead: '',
    kind: opt.view.kind,
    blocks: opt.view.blocks,
    sections: opt.view.sections,
    tailNote: opt.view.tailNote,
  };

  // uni 上下文没有 measureText，用近似量尺算折行
  const rows = planLines(src, makeRuler(LAYOUT.fsBody));
  const qrCount = (meta.qrImages || []).length;
  const laid = layoutRows(rows, { qrCount });
  const pageH = maxPageHeight(LAYOUT.width);
  const pages = paginate(laid.height, pageH);
  const colors = colorsOf(!!opt.dark);

  const paths = [];
  for (let i = 0; i < pages.length; i += 1) {
    const p = pages[i];
    // 第二个参数是页面实例：不传的话小程序端拿不到这个画布
    const ctx = uni.createCanvasContext(canvasId, page);
    paintPage(ctx, {
      colors,
      meta,
      rows: laid.rows
        .filter((r) => r.y + r.h > p.from && r.y < p.to)
        .map((r) => ({ ...r, y: r.y - p.from })),
      height: p.height,
      page: { index: i + 1, total: pages.length },
      pageLabel: meta.pageLabel,
    });
    // 等这一帧画完再导图，否则拿到空图
    // eslint-disable-next-line no-await-in-loop
    await new Promise((ok) => setTimeout(ok, 60));
    // eslint-disable-next-line no-await-in-loop
    paths.push(await toTempFile(canvasId, page, LAYOUT.width, p.height));
  }
  return paths;
}
