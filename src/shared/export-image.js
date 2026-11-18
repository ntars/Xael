/**
 * src/shared/export-image.js —— 结果长图导出（离屏画布镜像排版）
 *
 * 大白话：结果页长什么样，导出的图就长什么样——把同一份页面模型重画到画布上。
 * 三条死规矩：
 *   1. 2 倍图：逻辑尺寸 × EXPORT_DPR 才是像素尺寸，字才不糊；
 *   2. 画布有硬上限（单页面积 ≤ 4096²、单边 ≤ 8192），超了就分页，
 *      续页标题后加「（接上页）」，右下角标「第 i / n 张」；
 *   3. 右下角落两个二维码位图（网页版码 / 小程序码）。
 *
 * 本模块只做「排版计算 + 绘制」，不碰任何平台 API；拿画布由调用方传进来：
 *   Web → document.createElement('canvas')
 *   小程序 → wx.createOffscreenCanvas({type:'2d'})
 */

import { EXPORT_DPR, AREA_LIMIT, SIDE_LIMIT } from './export-metrics.js';

/** 版式常量（与结果页 CSS 对齐；字体家族与 theme.css 同序） */
export const LAYOUT = {
  width: 375,          // 逻辑宽（pt）
  pad: 24,             // 左右留白
  padTop: 32,
  padBottom: 32,
  gap: 12,             // 块间距
  rowGap: 6,           // 两栏行距
  labelCol: 64,        // 两栏左栏宽
  labelGap: 12,        // 两栏中缝
  fsTitle: 22,
  fsBody: 15,
  fsLabel: 12,
  fsNote: 12,
  lhTitle: 30,
  lhBody: 22,
  lhLabel: 18,
  lhNote: 18,
  qrSize: 72,          // 二维码边长（逻辑）
  qrGap: 12,
  maxSide: SIDE_LIMIT,
  dpr: EXPORT_DPR,
};

/** 字体串（canvas 与页面保持同一族） */
export function fontOf(size, weight = 400) {
  return `${weight} ${size}px -apple-system, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif`;
}

/**
 * 分页：内容总高 > 单页可用高 → 拆页。
 * @param {number} totalHeight 逻辑高
 * @param {number} pageHeight 单页可用高（逻辑）
 */
export function paginate(totalHeight, pageHeight) {
  const pages = Math.max(1, Math.ceil(totalHeight / pageHeight));
  const out = [];
  for (let i = 0; i < pages; i++) {
    const from = i * pageHeight;
    const to = Math.min(totalHeight, from + pageHeight);
    out.push({ index: i + 1, total: pages, top: from, from, to, height: to - from });
  }
  return out;
}

/** 像素预算是否越限（超了必须改分页策略） */
export function overflow(w, h) {
  return w * h > AREA_LIMIT || w > SIDE_LIMIT || h > SIDE_LIMIT;
}

/** 单页最大逻辑高：由面积上限反算，再受单边上限约束 */
export function maxPageHeight(width = LAYOUT.width) {
  const byArea = Math.floor(AREA_LIMIT / (width * LAYOUT.dpr * LAYOUT.dpr));
  return Math.min(byArea, Math.floor(SIDE_LIMIT / LAYOUT.dpr));
}

/**
 * 文本折行：按可用宽把一段话切成多行（中文逐字可断，英文按空格断）。
 * @returns {string[]}
 */
export function wrapText(ctx, text, maxWidth) {
  const src = String(text == null ? '' : text);
  const lines = [];
  // ctx 上若没设字体，measureText 会按默认 10px 回来，长行就永远不换行。
  // 调用方负责先 ctx.font = fontOf(size)；这里只做纯粹的断行。
  for (const para of src.split('\n')) {
    if (!para) { lines.push(''); continue; }
    // 避头点：句号/逗号这类标点不许落到下一行开头，宁可让上一行多挤一个字
    const NO_HEAD = '，。、；：？！）》」』”’,.;:?!)]}';
    let line = '';
    for (const ch of para) {
      const next = line + ch;
      if (ctx.measureText(next).width > maxWidth && line) {
        if (NO_HEAD.indexOf(ch) >= 0) {
          // 标点跟着上一行走（超一点点比孤标点好看）
          lines.push(next);
          line = '';
          continue;
        }
        lines.push(line);
        line = ch;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

/**
 * 排版计算：把页面模型算成绝对坐标的绘制指令（不依赖 canvas 也能算出来测）。
 * 复杂文本测量需要 ctx，因此本函数返回「行列表」，绘制阶段再落笔。
 */
export function planLines(view, ctx) {
  const L = LAYOUT;
  const innerW = L.width - L.pad * 2;
  const out = [];
  const push = (type, props) => out.push({ type, ...props });

  // 提问行：和结果页一样，先说「你问的是什么」，再列推演结果
  if (view.question) {
    push('kv', { label: view.questionLabel || '你的提问', lines: [view.question], size: L.fsBody, lh: L.lhBody, tone: 'question' });
  }
  push('title', { text: view.title || '', size: L.fsTitle, weight: 700, lh: L.lhTitle });
  if (view.lead) push('para', { text: view.lead, size: L.fsBody, lh: L.lhBody, tone: 'lead' });

  if (view.continued) push('title', { text: (view.title || '') + '（接上页）', size: L.fsTitle, weight: 700, lh: L.lhTitle });

  const blocksOf = (blocks) => {
    for (const b of blocks || []) {
      if (b.type === 'kv') {
        for (const r of b.rows) {
          if (ctx) ctx.font = fontOf(L.fsBody, 400);
          const lines = ctx ? wrapText(ctx, r.value, innerW - L.labelCol - L.labelGap) : [r.value];
          push('kv', { label: r.label, lines, size: L.fsBody, lh: L.lhBody });
        }
      } else {
        if (ctx) ctx.font = fontOf(L.fsBody, 400);
        const lines = ctx ? wrapText(ctx, b.text, innerW) : [b.text];
        push('para', { lines, size: L.fsBody, lh: L.lhBody });
      }
    }
  };

  if (view.kind === 'single') {
    blocksOf(view.blocks);
  } else {
    for (const s of view.sections || []) {
      push('head', { text: s.title, size: L.fsBody, weight: 600, lh: L.lhBody });
      blocksOf(s.blocks);
    }
  }
  if (view.tailNote) {
    if (ctx) ctx.font = fontOf(L.fsNote, 400);
    const lines = ctx ? wrapText(ctx, view.tailNote, innerW) : [view.tailNote];
    push('note', { lines, size: L.fsNote, lh: L.lhNote });
  }
  return out;
}

/** 行列表 → 每行的 y 与高度（供绘制与分页共用） */
export function layoutRows(rows, opt) {
  const L = LAYOUT;
  const o = opt || {};
  let y = L.padTop;
  const placed = [];
  for (const r of rows) {
    const count = r.lines ? r.lines.length : 1;
    const h = r.lh * count + (r.type === 'kv' ? L.rowGap : L.gap);
    placed.push({ ...r, y, h });
    y += h;
  }
  // 二维码单独占一块，插在正文与页脚之间——不压字
  if (o.qrCount > 0) {
    const qrH = L.qrSize + L.lhNote + L.gap;
    placed.push({ type: 'qr', y, h: qrH, lines: [''] });
    y += qrH;
  }
  return { rows: placed, height: y + L.padBottom };
}

/**
 * 绘制一页：调用方给出目标画布（2D 上下文）与要画的那一页的行区间。
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} opts {colors:{bg,ink,muted,foot}, meta, page, rows, height}
 */
export function drawPage(ctx, opts) {
  const L = LAYOUT;
  const c = opts.colors || {};
  const ink = c.ink || '#000000';
  const muted = c.muted || 'rgba(0,0,0,.56)';
  const foot = c.foot || 'rgba(0,0,0,.55)';
  const bg = c.bg || '#ffffff';

  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, L.width, opts.height);
  ctx.textBaseline = 'top';

  for (const r of opts.rows) {
    if (r.type === 'kv') {
      ctx.font = fontOf(L.fsLabel, 400);
      ctx.fillStyle = foot;
      ctx.textAlign = 'right';
      ctx.fillText(r.label, L.pad + L.labelCol, r.y);
      ctx.textAlign = 'left';
      ctx.font = fontOf(r.size, 400);
      ctx.fillStyle = muted;
      r.lines.forEach((ln, i) => ctx.fillText(ln, L.pad + L.labelCol + L.labelGap, r.y + i * r.lh));
    } else if (r.type === 'title') {
      ctx.font = fontOf(r.size, r.weight);
      ctx.fillStyle = ink;
      ctx.fillText(r.text, L.pad, r.y);
    } else if (r.type === 'head') {
      ctx.font = fontOf(r.size, r.weight);
      ctx.fillStyle = c.muted2 || '#666666';
      ctx.fillText(r.text, L.pad, r.y);
    } else {
      ctx.font = fontOf(r.size, 400);
      ctx.fillStyle = r.type === 'note' ? muted : (r.tone === 'lead' ? muted : muted);
      (r.lines || [r.text]).forEach((ln, i) => ctx.fillText(ln, L.pad, r.y + i * r.lh));
    }
  }

  // 二维码行（网页版码 / 小程序码）：由 layoutRows 排好位置，这里照位画，不压正文
  const meta = opts.meta || {};
  const qrRow = (opts.rows || []).filter((r) => r.type === 'qr')[0];
  if (qrRow && meta.qrImages && meta.qrImages.length) {
    ctx.font = fontOf(L.fsNote, 400);
    ctx.fillStyle = foot;
    ctx.textAlign = 'center';
    const qrSize = L.qrSize;
    const gap = L.qrGap;
    const totalW = meta.qrImages.length * qrSize + (meta.qrImages.length - 1) * gap;
    let qx = L.width - L.pad - totalW;
    const qy = qrRow.y;
    for (const img of meta.qrImages) {
      const bmp = img && img.img;
      if (bmp && typeof ctx.drawImage === 'function') ctx.drawImage(bmp, qx, qy, qrSize, qrSize);
      if (img && img.label) ctx.fillText(img.label, qx + qrSize / 2, qy + qrSize + 4);
      qx += qrSize + gap;
    }
    ctx.textAlign = 'left';
  }

  // 页脚：品牌 + 隐私声明 + 分页编号
  ctx.font = fontOf(L.fsNote, 400);
  ctx.fillStyle = foot;
  ctx.textAlign = 'left';
  const footY = opts.height - L.padBottom + 4;
  if (meta.brand) ctx.fillText(meta.brand + ' · ' + (meta.slogan || ''), L.pad, footY);
  if (opts.page && opts.page.total > 1) {
    ctx.textAlign = 'right';
    const label = opts.pageLabel || '第 %i / %n 张';
    ctx.fillText(label.replace('%i', String(opts.page.index)).replace('%n', String(opts.page.total)),
      L.width - L.pad, footY);
  }
  ctx.restore();
  return opts.height;
}
