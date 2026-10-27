/**
 * src/shared/result-format.js —— 结果页渲染（标签：值 两栏 + 分组）
 *
 * 大白话：所有内核的排盘数据都要变成统一的页面块：
 *   · 单算法：{title, lead, blocks}；
 *   · 多命中：≥2 块分小节并列；
 *   · 全套排盘：按 7 类分组（万年历黄历/八字命理/紫微斗数/六爻占卜/奇门遁甲/梅花易数/风水堪舆）。
 * 块内「标签：值」两栏：标签 ≤5 字且值 ≤40 字才走两栏（左栏 64pt 定宽），否则整行。
 */

/** 块边界判定：结果块的「类名 · 短名」格式 */
export function blockTitle(block) {
  return block.类名 && block.短名 ? `${block.类名} · ${block.短名}` : (block.类名 || block.短名 || '');
}

/** 是否走两栏 */
export function isPairRow(label, value) {
  const vs = String(value);
  return label.length <= 5 && vs.length <= 40 && !vs.includes('\n');
}

/** 数据对象 → 行列表（[{label, value}]），数组/嵌套拍平一层 */
export function flattenRows(data) {
  const rows = [];
  for (const k in data) {
    const v = data[k];
    if (v == null) continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      rows.push({ label: k, value: '', group: true });
      for (const k2 in v) {
        const v2 = v[k2];
        if (v2 == null) continue;
        rows.push({ label: String(k2).slice(0, 5), value: typeof v2 === 'object' ? JSON.stringify(v2) : String(v2) });
      }
    } else if (Array.isArray(v)) {
      rows.push({ label: String(k).slice(0, 5), value: v.join('、') });
    } else {
      rows.push({ label: String(k).slice(0, 5), value: String(v) });
    }
  }
  return rows;
}

/** 按类名分组（全套排盘） */
export function groupBlocks(blocks) {
  const groups = [];
  const seen = {};
  for (const b of blocks) {
    const g = b.类名 || '其他';
    (seen[g] = seen[g] || []).push(b);
  }
  for (const g in seen) groups.push({ 类名: g, blocks: seen[g] });
  return groups;
}

/**
 * 拼装结果页数据模型。
 * @param {Array<{title, lead, blocks}>} results 多命中的多个结果
 * @returns {Object} 页面直接可用的结构
 */
export function buildResultView(results) {
  if (!results || !results.length) return null;
  if (results.length === 1) {
    const r = results[0];
    return { kind: 'single', title: r.title, lead: r.lead, blocks: r.blocks };
  }
  return { kind: 'multi', sections: results.map((r) => ({ title: r.title, lead: r.lead, blocks: r.blocks })) };
}
