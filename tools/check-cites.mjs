#!/usr/bin/env node
/**
 * tools/check-cites.mjs —— 文献引用审计（只读检查）
 *
 * 干什么：把 src/core 下每个 JS 文件里写的《书名·篇名》引用，逐条拿到
 * refs-texts/ 对应底本正文里去查，确认「书名在库内、篇名真能命中原文」。
 *
 * 为什么要它：算法口径必须能回溯到公版底本，写错书名或篇名等于没有依据。
 * 这个脚本不判断口径对不对，只保证「引用的那一篇真的存在」。
 *
 * 用法：node tools/check-cites.mjs        （有问题时退出码 1）
 *
 * 两条约定（与 docs/CALIBER-NOTES.md 一致）：
 *   1. 引用写法一律「《书名·篇名》」，不写「同上」「同书」「前引」；
 *   2. 库外文献必须在方括号前写「库外」二字，脚本会跳过这些引用。
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** 去空白（正文是古籍，字间常夹全角空格） */
const norm = (s) => s.replace(/[\s\u3000\u00a0]+/g, '');

/**
 * 底本异体字归一。
 * 古籍底本大量使用异体字，若逐字比对会把「论太嵗」判成不存在。这里只做
 * 「同一字的异写」归一，不改动任何实质性用字（底本原文仍照录在正文与文档里）。
 */
const VARIANT = {
  嵗: '岁', 歲: '岁', 艶: '艳', 艷: '艳', 徳: '德', 黒: '黑', 剋: '克',
  隂: '阴', 陽: '阳', 録: '录', 錄: '录', 祿: '禄', 巳: '巳',
  為: '为', 與: '与', 萬: '万', 門: '门', 遁: '遁', 寶: '宝', 鑒: '鉴',
  經: '经', 論: '论', 書: '书', 時: '时', 傳: '传', 註: '注', 釋: '释',
  總: '总', 統: '统', 紀: '纪', 協: '协', 辨: '辨', 義: '义', 例: '例',
  卷: '卷', 第: '第', 一: '一',
};
const uni = (s) => s.replace(/[\u3400-\u9fff]/g, (c) => VARIANT[c] || c);

/** 读入 refs-texts 下所有底本，按书名建索引 */
function loadBooks() {
  const dir = join(ROOT, 'refs-texts');
  const books = {};
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md') || f.startsWith('README')) continue;
    const m = f.match(/《([^》]+)》/);
    if (m) books[m[1]] = norm(uni(readFileSync(join(dir, f), 'utf8')));
  }
  return books;
}

/** 收集 src/core 下所有 js 文件（data/ 目录是纯数据表，不参与引用审计） */
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      if (f === 'data') continue;
      walk(p, out);
    } else if (f.endsWith('.js')) out.push(p);
  }
  return out;
}

/** 书名简称 → 底本全名 */
const ALIAS = {
  协纪辨方书: '钦定协纪辨方书', 协纪: '钦定协纪辨方书',
  統宗: '奇门遁甲统宗', 统宗: '奇门遁甲统宗', 奇門遁甲統宗: '奇门遁甲统宗',
  奇門寶鑑: '奇门宝鉴', 指南: '大六壬指南', 增删: '增删卜易', 卜筮: '卜筮正宗',
};

const books = loadBooks();
const rows = new Map();
const re = /《([^》]{2,40})》/g;

for (const f of walk(join(ROOT, 'src/core'))) {
  const s = readFileSync(f, 'utf8');
  let m;
  while ((m = re.exec(s))) {
    // 「库外」标记的引用直接跳过（库外文献不在 refs-texts 里，无从比对）
    if (s.slice(Math.max(0, m.index - 6), m.index).indexOf('库外') >= 0) continue;
    const parts = m[1].split('·');
    const book = ALIAS[parts[0]] || parts[0];
    if (!books[book]) {
      rows.set('BOOK?' + m[1], [...new Set((rows.get('BOOK?' + m[1]) || []).concat(f))]);
      continue;
    }
    if (parts.length < 2) continue; // 只写书名、不写篇名：允许（整书级依据）
    const k = book + '·' + parts.slice(1).join('·');
    rows.set(k, [...new Set((rows.get(k) || []).concat(f))]);
  }
}

const bad = [];
for (const [k, files] of rows) {
  if (k.startsWith('BOOK?')) {
    bad.push({ k, files, why: '书名不在库内' });
    continue;
  }
  const [book, ...rest] = k.split('·');
  const chap = rest.join('·');
  const stripped = chap.replace(/^卷[一二三四五六七八九十百]+(之[一二三四五六七八九十]+)?·?/, '');
  const stripParen = (x) => x.replace(/[（(][^）)]*[）)]/g, '');
  const norm2 = (x) => norm(uni(x)).replace(/卷[一二三四五六七八九十]+至卷[一二三四五六七八九十]+·/, '');
  const segs = (x) => {
    const arr = x.split('·');
    const last = arr[arr.length - 1].replace(/[一二三四五六七八九十]$/, '');
    return [x, arr[arr.length - 1], last, last.replace(/^[一二三四五六七八九十]+至[一二三四五六七八九十]+·/, '')];
  };
  const cands = [chap, stripped, stripParen(chap), stripParen(stripped)]
    .concat(chap.split('/'), stripped.split('/'))
    .flatMap(segs)
    .map((x) => norm2(stripParen(x)).replace(/^[一二三四五六七八九十]+、/, '').trim())
    .filter(Boolean);
  if (!cands.some((x) => books[book].indexOf(norm2(x)) >= 0)) bad.push({ k, files, why: '篇名未命中' });
}

console.log(`总引用 ${rows.size} 条｜有问题 ${bad.length} 条`);
for (const b of bad) {
  console.log(`  [${b.why}] ${b.k}`);
  console.log(`      ${b.files.map((x) => x.replace(ROOT + '/', '')).join(', ')}`);
}
process.exit(bad.length ? 1 : 0);
