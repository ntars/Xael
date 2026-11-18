/**
 * tools/build-uni.js —— uni-app 产物校验（ESM → CommonJS 转写后的一致性检查）
 *
 * 大白话：uni-app 由 HBuilderX / CLI 自己编译，仓库里不存编译产物。
 * 但壳文件是手写的，容易和 core/shared 脱节（比如 import 了已删除的函数）。
 * 所以这里做三件事，保证「拿 HBuilderX 一开就能跑」：
 *   ① 把壳文件里的相对 import 全部解析一遍，确认目标文件与具名导出真的存在；
 *   ② 校验壳没有引入旧时代的 API（SETTINGS / blockTitle / flattenRows 之类）；
 *   ③ 校验样式遵守 WXSS 硬约束（无 rpx、无 ::before/::after、无通配选择器）。
 *
 * 用法：node tools/build-uni.js [--check]   （--check 时只报错，不写任何文件）
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHELL = join(ROOT, 'src', 'shells', 'uniapp');

/** 收集壳目录下所有文件 */
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

/** 从 src/shared/settings.js 这类文件里抽出具名导出（正则足够，代码风格受控） */
function namedExports(file) {
  const src = readFileSync(file, 'utf8');
  const names = new Set();

  // export function f / export async function f / export class F
  for (const m of src.matchAll(/^export\s+(?:async\s+)?(?:function|class)\s+(\w+)/gm)) names.add(m[1]);
  // export const a = / let / var
  for (const m of src.matchAll(/^export\s+(?:const|let|var)\s+(\w+)/gm)) names.add(m[1]);
  // export const a = 1, b = 2 （同一行多声明）
  for (const m of src.matchAll(/^export\s+(?:const|let|var)\s+([^=;\n]+)=/gm)) {
    for (const part of m[1].split(',')) {
      const id = part.trim().split(/[\s:]/)[0];
      if (/^[A-Za-z_$][\w$]*$/.test(id)) names.add(id);
    }
  }
  // export { a, b as c }
  for (const m of src.matchAll(/^export\s+\{([^}]*)\}/gm)) {
    for (const part of m[1].split(',')) {
      const s = part.trim();
      if (!s) continue;
      const alias = s.split(/\s+as\s+/)[1];
      names.add((alias || s).trim());
    }
  }
  // export default
  if (/^export\s+default\s/m.test(src)) names.add('default');
  return names;
}

/** 检查一个 Vue 文件里的 import 是否都成立 */
function checkImports(file, problems) {
  const src = readFileSync(file, 'utf8');
  const dir = dirname(file);

  for (const m of src.matchAll(/^import\s+([^;]+?)\s+from\s+['"]([^'"]+)['"];?/gm)) {
    const clause = m[1].trim();
    const spec = m[2];
    if (!spec.startsWith('.')) continue; // 第三方包交给 HBuilderX

    const target = resolve(dir, spec);
    if (!existsSync(target)) {
      problems.push(`${rel(file)} → 找不到模块 ${spec}`);
      continue;
    }

    const names = namedExports(target);
    // import { a, b as c } from '...'
    const braced = clause.match(/\{([^}]*)\}/);
    if (braced) {
      for (const part of braced[1].split(',')) {
        const raw = part.trim();
        if (!raw) continue;
        const local = raw.split(/\s+as\s+/)[0].trim();
        if (!names.has(local)) problems.push(`${rel(file)} → ${spec} 未导出 ${local}`);
      }
    }
    // import X from '...'（默认导入）
    const def = clause.replace(/\{[^}]*\}/, '').replace(/,/g, '').trim();
    if (def && !names.has('default')) problems.push(`${rel(file)} → ${spec} 没有默认导出，却写了默认导入 ${def}`);
  }
}

/** 检查壳里有没有用到已废弃的旧 API（这些名字在 5.0.0 里已经不存在） */
function checkLegacyApi(file, problems) {
  const src = readFileSync(file, 'utf8');
  const banned = ['SETTINGS.', 'blockTitle', 'flattenRows', 'isPairRow', 'run as withLock'];
  for (const b of banned) {
    if (src.includes(b)) problems.push(`${rel(file)} → 使用了已废弃接口 ${b}`);
  }
}

/** 检查样式硬约束（WXSS 兼容） */
function checkStyles(file, problems) {
  const src = readFileSync(file, 'utf8');
  const raw = (src.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || (file.endsWith('.css') || file.endsWith('.wxss') ? src : '');
  if (!raw) return;
  // 注释里会写「禁 rpx」「不用 ::before」这类说明，判断前先剥掉注释
  const style = raw.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\brpx\b/.test(style)) problems.push(`${rel(file)} → 样式里出现 rpx，统一用 px`);
  if (/::before|::after/.test(style)) problems.push(`${rel(file)} → 样式里用了 ::before/::after，WXSS 不支持`);
  if (/(^|[\s,{}])\*[\s,{.]/.test(style)) problems.push(`${rel(file)} → 样式里用了通配选择器，WXSS 不支持`);
}

const rel = (p) => p.replace(ROOT + '/', '');

/** 主校验 */
export function check() {
  const problems = [];
  const files = walk(SHELL);

  for (const f of files) {
    if (f.endsWith('.vue')) {
      checkImports(f, problems);
      checkLegacyApi(f, problems);
      checkStyles(f, problems);
    } else if (f.endsWith('.js')) {
      checkImports(f, problems);
      checkLegacyApi(f, problems);
    } else if (f.endsWith('.wxss') || f.endsWith('.css')) {
      checkStyles(f, problems);
    }
  }

  // 必需文件（少一个 HBuilderX 就打不开）
  const required = [
    'pages.json', 'manifest.json', 'main.js', 'App.vue',
    'pages/index/index.vue', 'theme-uni.js', 'export-uni.js',
    'static/icons/logo.png', 'static/icons/logo-white.png',
    'static/icons/icon-back.svg', 'static/icons/icon-forward.svg',
    'static/icons/icon-forward-danger.svg', 'static/icons/icon-search.svg',
  ];
  for (const r of required) {
    if (!existsSync(join(SHELL, r))) problems.push(`缺必需文件：src/shells/uniapp/${r}`);
  }

  for (const p of problems) console.error('✗ ' + p);
  if (problems.length) return { ok: false, problems };

  console.log(`✓ uni-app 壳校验通过：${files.length} 个文件，导入与样式约束全部成立`);
  return { ok: true, count: files.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = check();
  process.exit(r.ok ? 0 : 1);
}
