/**
 * tools/check-readings.mjs —— 断语数据表「逐子句可回溯」校验
 *
 * 大白话：`src/core/purple-star/data/palace-readings.js` 那 168 格（十四主星 × 十二宫）是全项目
 *   唯一整块照录原书的断语数据。它一旦被「顺手润色」过，输出仍然通顺、仍然像古文，
 *   但已经不是原书的话了——这种损坏没有任何报错，只能靠回校。
 *
 * 校验法：把每格断语按标点切成子句（≥5 字），去掉标点空白后在对应底本正文里找子串。
 *   · 子句必须能在底本中原样找到（允许只差标点）；
 *   · 任一条找不到即失败，并把该子句打印出来。
 *
 * 与 tools/check-cites.mjs 分工：那个查「篇名是否存在于底本」，这个查「内容是否原样来自底本」。
 *
 * 用法：node tools/check-readings.mjs
 * 退出码：0 全部可回溯；1 有子句回不到底本。
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SOURCES = [
  {
    data: 'src/core/purple-star/data/palace-readings.js',
    book: 'refs-texts/《紫微斗数全书》-明·罗洪先（题陈希夷）.md',
    label: '紫微·星曜居宫断语（168 格）',
    pick: (m) => Object.values(m.PALACE_READINGS).flatMap((x) => Object.values(x)),
  },
  {
    data: 'src/core/six-ren/general-branch-images.js',
    book: 'refs-texts/《六壬大全》-明·佚名（四库本）.md',
    label: '六壬·十二将临十二支取象（144 格）',
    pick: (m) => Object.values(m.GENERAL_BRANCH_IMAGES).flatMap((row) => Object.values(row).map((v) => (Array.isArray(v) ? v[1] : v))),
  },
];

/** 去标点与空白，只比字 */
const norm = (s) => String(s).replace(/[\s，。；：、（）()《》「」【】·…—－\-“”‘’？！,.:;]/g, '');

let bad = [];
let checked = 0;
let clauses = 0;

for (const src of SOURCES) {
  const mod = await import(join(ROOT, src.data));
  const base = norm(readFileSync(join(ROOT, src.book), 'utf8'));
  for (const text of src.pick(mod)) {
    checked += 1;
    const parts = String(text).split(/[，。；：、]/).map((x) => x.trim()).filter((x) => x.length >= 5);
    for (const c of parts) {
      clauses += 1;
      // 「（诸家通行说）」这类注明来源的括注不参与比对——它本来就不是底本原文
      if (!base.includes(norm(c))) bad.push(`${src.label}｜${c}`);
    }
  }
}

if (bad.length) {
  console.log(`断语回校失败 ${bad.length} 条：`);
  bad.slice(0, 20).forEach((b) => console.log('  ✗ ' + b));
  process.exit(1);
}
console.log(`✓ 断语数据表逐子句可回溯 —— ${checked} 格｜${clauses} 子句｜0 条回不到底本`);
