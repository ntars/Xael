/**
 * src/shared/result-format.js —— 结果文本 → 页面块（渲染唯一入口）
 *
 * 大白话：内核的每项功能都吐一段「中文多行文本」，这里把它切成页面能排版的块：
 *   · 首行【标题】→ 页面标题；
 *   · 第一个句号或换行前的那句 → 导读（lead）；
 *   · 剩余每一行若能拆成「标签：值」且标签不超过 5 字、值不超过 40 字 → 走两栏（左栏 64px）；
 *     连续的这类行合并成一组两栏表；拆不开的整行当正文段落；
 *   · 以「【」开头的行视为块边界（块标题形如【类名 · 短名】）；
 *   · 「【需补充信息】」开头的那一行单独抽出来放末尾（tailNote），不混进正文。
 *
 * 标点归一是硬规则：行内出现中文分号一律换成逗号（页面不出现；），
 * 连续句号折成一个，句末标点前不挂逗号。
 */

/* ------------------------------------------------------------------ *
 * 小工具
 * ------------------------------------------------------------------ */

/** 标点归一：中文分号 → 逗号；连续句号折一；句末标点前不挂逗号 */
export function normalizePunct(s) {
  return String(s == null ? '' : s)
    .replace(/[；;]+(?=[。\n])/g, '，')
    .replace(/[。]{2,}/g, '。')
    .replace(/([。！？])[，,]+/g, '$1')
    .replace(/；/g, '，');
}

/** 取首行标题：返回 {title, rest} */
export function takeTitle(text) {
  const lines = String(text || '').split('\n');
  const head = lines[0] || '';
  const m = head.match(/^\s*【([^】]+)】\s*(.*)$/);
  if (m) {
    const tail = m[2] ? [m[2], ...lines.slice(1)] : lines.slice(1);
    return { title: m[1], rest: tail.join('\n') };
  }
  return { title: '', rest: String(text || '') };
}

/** 是否块边界行：【…】且中点两侧带空白（紧凑写法【神煞断语·建除】不算边界） */
export function isBlockBoundary(line) {
  const v = String(line || '');
  if (/^\s*【[^】]*?\s+·\s+[^】]+】/.test(v)) return true;
  // 小节分隔行：整行只有 === … === 或 —— … ——
  return /^\s*(={2,}|—{2,})[^\n]*\1\s*$/.test(v);
}

/**
 * 是否两栏行：标签 2–5 个汉字，值 1–40 字、不含句号与换行。
 * 旧版有两处口径差异（原实现按「标签≤5 且值≤40」后仍直接排版）：
 *   · 值里带「，」但不超过 40 字 → 旧版同样走两栏，这里保持一致，允许多分句；
 *   · 值里带「。」 → 一定是整句叙述，走整行段落。
 */
export function isKvPair(label, value) {
  const l = String(label || '');
  const v = String(value || '');
  if (!l || l.length > 5) return false;
  if (!v || v.length > 40) return false;
  if (/[。\n]/.test(v)) return false;
  return true;
}

/** 拆一行「标签：值」 */
const KV_RE = /^([\u4e00-\u9fa5]{2,6})[：:]\s*(.+)$/;

/* ------------------------------------------------------------------ *
 * 单段文本 → 块
 * ------------------------------------------------------------------ */

/**
 * 一段文本 → {title, lead, blocks, tailNote}
 * blocks 项：{type:'kv', rows:[{label, value}]} 或 {type:'text', text}
 */
export function formatText(text) {
  const { title, rest } = takeTitle(text);
  const norm = normalizePunct(rest);
  const rawLines = norm.split('\n').map((l) => l.trim()).filter((l) => l.length);

  // 摘出「需补充信息」行
  let tailNote = '';
  const lines = [];
  for (const l of rawLines) {
    if (/^【需补充信息】/.test(l)) tailNote = tailNote ? tailNote + '\n' + l : l;
    else lines.push(l);
  }

  // 首段导读：第一行的第一个句子
  let lead = '';
  let body = lines;
  if (lines.length) {
    const first = lines[0];
    const m = first.match(/^(.+?[。！？])(.*)$/);
    if (m) {
      lead = m[1];
      body = m[2].trim() ? [m[2].trim(), ...lines.slice(1)] : lines.slice(1);
    } else {
      lead = first;
      body = lines.slice(1);
    }
  }

  // 逐行建块：连续两栏行 → 一张两栏表
  const blocks = [];
  let kv = null;
  const flush = () => {
    if (kv && kv.rows.length) blocks.push(kv);
    kv = null;
  };
  for (const line of body) {
    if (isBlockBoundary(line)) {
      flush();
      blocks.push({ type: 'text', text: line });
      continue;
    }
    const m = line.match(KV_RE);
    if (m && isKvPair(m[1], m[2])) {
      if (!kv) kv = { type: 'kv', rows: [] };
      kv.rows.push({ label: m[1], value: m[2] });
    } else {
      flush();
      blocks.push({ type: 'text', text: line });
    }
  }
  flush();

  return { title, lead, blocks, tailNote };
}

/* ------------------------------------------------------------------ *
 * 多个结果 → 页面模型
 * ------------------------------------------------------------------ */

/**
 * 是否全套排盘：结果里有 ≥2 项且来自两门以上
 * （旧版的「全套排盘」入口已经取消，这里只用于把「一句话命中多门」按大类归组。）
 */
export function groupBySection(items) {
  const order = ['万年历黄历', '八字命理', '紫微斗数', '六爻占卜', '奇门遁甲', '梅花易数', '风水堪舆'];
  const map = new Map();
  for (const it of items) {
    const name = it.类名 || '其他';
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(it);
  }
  const keys = [...map.keys()].sort((a, b) => {
    const ia = order.indexOf(a); const ib = order.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return keys.map((name) => ({ name, short: name, count: map.get(name).length, items: map.get(name) }));
}

/**
 * 页面渲染模型（结果页与导出图共用）。
 *
 * @param {Array<{key,名,短名,类名?,text}>} results analyze() 产出的结果列表
 * @returns {null|{
 *   kind:'single'|'multi',
 *   title:string, lead:string, blocks:Array, sections:Array, tailNote:string
 * }}
 */
export function buildResultView(results) {
  if (!results || !results.length) return null;
  const parts = results.map((r) => {
    const f = formatText(r.text);
    return {
      key: r.key,
      名: r.名,
      短名: r.短名,
      title: f.title || r.短名 || r.名 || '',
      lead: f.lead,
      blocks: f.blocks,
      tailNote: f.tailNote,
    };
  });

  if (parts.length === 1) {
    const p = parts[0];
    return {
      kind: 'single',
      title: p.title,
      lead: p.lead,
      blocks: p.blocks,
      sections: [],
      tailNote: p.tailNote,
    };
  }

  return {
    kind: 'multi',
    title: parts[0].title,
    lead: '',
    blocks: [],
    sections: parts,
    tailNote: parts.map((p) => p.tailNote).filter(Boolean).join('\n'),
  };
}
