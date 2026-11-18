/**
 * export-mp.js —— 小程序端的导出适配层（把「算好的行」画到真画布上）
 *
 * 大白话：排版规则全部在 src/shared/export-image.js（与网页版同一份），
 *   这一层只做小程序特有的事：
 *     ① 建 canvas 2d 节点、按导出倍率换算像素；
 *     ② 逐页画、逐页 wx.canvasToTempFilePath 出临时文件；
 *     ③ 交给 wx.previewImage 让用户长按保存（零相册权限）。
 *
 * 为什么不用旧接口 wx.createCanvasContext：那是已废弃的旧 canvas，
 *   文字宽度量不准（分页会错行）。这里统一用 type="2d" 的新 canvas，getContext('2d') 是标准实现。
 */

const {
  planLines, layoutRows, paginate, drawPage, maxPageHeight, LAYOUT,
} = require('../src/shared/export-image.js');
const { EXPORT_DPR } = require('../src/shared/export-metrics.js');

/** 导出配色跟着当前深浅色走（2 倍图，颜色写死成具体值，画布不认 CSS 变量） */
function colorsOf(dark) {
  return dark
    ? { bg: '#000000', ink: '#ffffff', muted: 'rgba(255,255,255,.5)', foot: 'rgba(255,255,255,.48)' }
    : { bg: '#ffffff', ink: '#000000', muted: 'rgba(0,0,0,.56)', foot: 'rgba(0,0,0,.55)' };
}

/**
 * 规划：把结果模型算成「每页要画哪些行、画布多大」。
 * 不碰任何小程序 API，纯计算，方便单独验证。
 * @param {object} view 渲染模型（与网页版同一结构）
 * @param {{question?:string, dark?:boolean, meta?:object}} opt
 */
function planExport(view, opt) {
  const o = opt || {};
  const meta = o.meta || {};
  const pageH = maxPageHeight(LAYOUT.width);

  // 交给排版器的完整视图：提问 → 结果 → 附注，与结果页同序
  const src = {
    question: o.question || '',
    questionLabel: meta.questionLabel || '你的提问',
    title: meta.resultLabel || '玄玖灵犀推演结果：',
    lead: '',
    kind: view.kind,
    blocks: view.blocks,
    sections: view.sections,
    tailNote: view.tailNote,
  };

  // 此时还没有真上下文，长行先按整段估；drawToCanvas 拿到 canvas 后会重算换行
  const laid = layoutRows(planLines(src, null), { qrCount: (meta.qrImages || []).length });
  return {
    view: src,
    pages: paginate(laid.height, pageH),
    rows: laid.rows,
    height: laid.height,
    pageH,
    colors: colorsOf(!!o.dark),
    meta,
  };
}

/** 取页面里的 canvas 节点（type="2d"） */
function nodeOf(page, id) {
  return new Promise((resolve, reject) => {
    wx.createSelectorQuery()
      .in(page)
      .select('#' + id)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res && res[0] && res[0].node) resolve(res[0].node);
        else reject(new Error('canvas 节点未就绪'));
      });
  });
}

/** 把一张画好的画布导成临时文件路径 */
function toTempFile(page, canvas) {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas,
      fileType: 'png',
      destWidth: canvas.width,
      destHeight: canvas.height,
      success: (r) => resolve(r.tempFilePath),
      fail: reject,
    }, page);
  });
}

/**
 * 逐页绘制并出图。
 * @param {object} page 小程序页面实例（用来查节点 / 传 context）
 * @param {object} plan planExport 的结果
 * @returns {Promise<string[]>} 临时文件路径数组
 */
async function drawToCanvas(page, plan) {
  const canvas = await nodeOf(page, 'exportCanvas');
  const ctx = canvas.getContext('2d');

  // plan 阶段没有 2D 上下文，长行是「按估算宽度」换行的；
  // 拿到真 canvas 后用同一份 planLines 重算一遍，保证换行位置与画布实测一致。
  const measured = planLines(plan.view, ctx);
  const laid = layoutRows(measured, { qrCount: (plan.meta.qrImages || []).length });
  plan.rows = laid.rows;
  plan.height = laid.height;
  plan.pages = paginate(laid.height, plan.pageH);
  plan.view.measured = true;

  // 两个二维码位图（网页版码 / 小程序码）：小程序得先 loadImage 才能 drawImage
  const meta = plan.meta || {};
  if (Array.isArray(meta.qrImages) && meta.qrImages.length) {
    meta.qrImages = await Promise.all(meta.qrImages.map(async (it) => {
      try {
        const img = canvas.createImage();
        // 静态资源走站点绝对路径（settings.exportMeta.qrImages[].path）
        await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = '/' + it.path; });
        return { img, label: it.label };
      } catch (e) {
        return null; // 图挂了就不画码，别让整张图失败
      }
    }));
    meta.qrImages = meta.qrImages.filter(Boolean);
  }

  const paths = [];
  for (let i = 0; i < plan.pages.length; i += 1) {
    const p = plan.pages[i];
    canvas.width = Math.round(LAYOUT.width * EXPORT_DPR);
    canvas.height = Math.round(p.height * EXPORT_DPR);
    ctx.scale(EXPORT_DPR, EXPORT_DPR);

    drawPage(ctx, {
      colors: plan.colors,
      meta: { ...plan.meta, qrImages: (plan.meta.qrImages || []).map((q) => ({ img: q.img, label: q.label })) },
      rows: plan.rows
        .filter((r) => r.y + r.h > p.from && r.y < p.to)
        .map((r) => ({ ...r, y: r.y - p.from })),
      height: p.height,
      page: { index: i + 1, total: plan.pages.length },
      pageLabel: plan.meta.pageLabel,
    });

    // 逐页出图：一块画布一块内存，画完立刻吐文件
    // eslint-disable-next-line no-await-in-loop
    paths.push(await toTempFile(page, canvas));
  }
  return paths;
}

module.exports = { planExport, drawToCanvas, colorsOf };
