/**
 * tools/build-mp.js —— 小程序构建（ES Module → 小程序可用的 CommonJS 产物）
 *
 * 大白话：小程序的 JS 引擎不能直接 import ESM，所以这里把 src/core 与 src/shared
 * 逐文件转写：去掉 import/export 关键字，改成「模块表 + require」，运行时由 mini-loader 提供。
 * 设计：每个源文件产出一个独立小程序文件（保持模块化、按需加载），不做单文件打包。
 *
 * 用法：
 *   node tools/build-mp.js          生成 dist/mp-weixin
 *   node tools/build-mp.js --check  只校验（产物与源一致、包体 ≤2MB），不写文件
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist', 'mp-weixin');
const CHECK = process.argv.includes('--check');
const SIZE_LIMIT = 2 * 1024 * 1024; // 小程序单分包 2MB 上限

/** 简易字符串哈希（给 re-export 的临时变量名去重） */
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** 需要编译进小程序的源码目录 */
const SOURCES = ['src/core', 'src/shared'];

/** 递归收集 .js 文件 */
function collect(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) collect(p, acc);
    else if (name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

/**
 * 单文件转写：ESM → 小程序 CommonJS
 *   import { a, b as c } from './x.js'  →  const { a, b: c } = require('<rel>')
 *   import x from './x.js'              →  const x = require('<rel>').default
 *   export function f / const / class   →  去掉 export，末尾补 module.exports
 *   export default                      →  module.exports.default = ...
 *   export { a, b }                     →  末尾补 module.exports.a = a
 */
export function transform(src, filePath) {
  const exported = [];
  let code = src;

  // 0) re-export（export { a, b } from '...'）→ require + 转出，必须在其余规则之前处理
  code = code.replace(/^export\s+\{([^}]*)\}\s+from\s+['"]([^'"]+)['"];?/gm, (_m, names, from) => {
    const list = names.split(',').map((s) => s.trim()).filter(Boolean);
    const locals = list.map((s) => {
      const [local, alias] = s.split(/\s+as\s+/);
      return { local: local.trim(), alias: (alias || local).trim() };
    });
    const lines = [`const __re_${Math.abs(hash(from))} = require('${from}');`];
    for (const { local, alias } of locals) {
      exported.push(`module.exports.${alias} = __re_${Math.abs(hash(from))}.${local};`);
    }
    return lines.join('\n');
  });

  // 1) 处理 import
  code = code.replace(/^import\s+\{([^}]*)\}\s+from\s+['"]([^'"]+)['"];?/gm, (_m, names, from) => {
    const mapped = names
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/\s+as\s+/, ': '))
      .join(', ');
    return `const { ${mapped} } = require('${from}');`;
  });
  code = code.replace(/^import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/gm, (_m, name, from) => `const ${name} = require('${from}');`);
  code = code.replace(/^import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/gm, (_m, name, from) => `const ${name} = require('${from}').default;`);
  code = code.replace(/^import\s+['"]([^'"]+)['"];?/gm, (_m, from) => `require('${from}');`);

  // 2) export default function / class（带名字）
  code = code.replace(/^export\s+default\s+(async\s+)?function\s+(\w+)/gm, (_m, asyncKw, name) => {
    exported.push(`module.exports.${name} = ${name};`);
    return `${asyncKw || ''}function ${name}`;
  });
  // 3) export default 表达式
  code = code.replace(/^export\s+default\s+/gm, 'module.exports.default = ');

  // 4) export async function / function / class / const / let / var
  code = code.replace(/^export\s+(async\s+)?function\s+(\w+)/gm, (_m, asyncKw, name) => {
    exported.push(`module.exports.${name} = ${name};`);
    return `${asyncKw || ''}function ${name}`;
  });
  code = code.replace(/^export\s+class\s+(\w+)/gm, (_m, name) => {
    exported.push(`module.exports.${name} = ${name};`);
    return `class ${name}`;
  });
  code = code.replace(/^export\s+(const|let|var)\s+(\w+)/gm, (_m, kw, name) => {
    exported.push(`module.exports.${name} = ${name};`);
    return `${kw} ${name}`;
  });

  // 5) export { a, b as c }
  code = code.replace(/^export\s+\{([^}]*)\};?/gm, (_m, names) => {
    for (const raw of names.split(',')) {
      const s = raw.trim();
      if (!s) continue;
      const [local, alias] = s.split(/\s+as\s+/);
      exported.push(`module.exports.${(alias || local).trim()} = ${local.trim()};`);
    }
    return '';
  });

  // 6) 末尾追加导出
  if (exported.length) code += '\n\n' + exported.join('\n') + '\n';

  // 7) 相对路径补 .js（小程序 require 需要确切文件）
  code = code.replace(/require\('(\.{1,2}\/[^']+)'\)/g, (_m, p) => (p.endsWith('.js') ? `require('${p}')` : `require('${p}.js')`));

  // 8) 头注
  return `// 由 tools/build-mp.js 自 ${relative(ROOT, filePath)} 生成，请勿手改\n${code}`;
}

/** 主构建 */
export function build({ check = CHECK } = {}) {
  const files = [];
  for (const d of SOURCES) files.push(...collect(join(ROOT, d)));

  const outputs = new Map();
  for (const f of files) {
    const rel = relative(join(ROOT, 'src'), f); // core/xxx.js
    outputs.set(join('src', rel), transform(readFileSync(f, 'utf8'), f));
  }

  // 小程序壳文件原样拷入
  const shellDir = join(ROOT, 'src', 'shells', 'mp-weixin');
  const shellFiles = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else shellFiles.push(p);
    }
  };
  if (existsSync(shellDir)) walk(shellDir);
  for (const f of shellFiles) outputs.set(relative(shellDir, f), readFileSync(f, 'utf8'));

  const total = [...outputs.values()].reduce((n, s) => n + Buffer.byteLength(s), 0);

  if (check) {
    const problems = [];
    if (total > SIZE_LIMIT) problems.push(`包体 ${(total / 1024).toFixed(1)}KB 超过 2MB 上限`);
    if (!existsSync(OUT)) problems.push('产物目录不存在，请先执行 node tools/build-mp.js');
    else {
      for (const [rel, content] of outputs) {
        const p = join(OUT, rel);
        if (!existsSync(p)) problems.push(`缺产物：${rel}`);
        else if (readFileSync(p, 'utf8') !== content) problems.push(`产物与源不一致：${rel}`);
      }
    }
    for (const p of problems) console.error('✗ ' + p);
    if (problems.length) return { ok: false, problems, total };
    console.log(`✓ 小程序产物校验通过：${outputs.size} 个文件，共 ${(total / 1024).toFixed(1)}KB`);
    return { ok: true, total };
  }

  if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
  for (const [rel, content] of outputs) {
    const p = join(OUT, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
  writeFileSync(join(OUT, 'package.json'), '{ "type": "commonjs" }\n');
  console.log(`✓ 已生成 dist/mp-weixin：${outputs.size} 个文件，共 ${(total / 1024).toFixed(1)}KB`);
  return { ok: true, total, count: outputs.size };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = build();
  process.exit(r.ok ? 0 : 1);
}
