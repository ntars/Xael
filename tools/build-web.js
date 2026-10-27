/**
 * tools/build-web.js —— 网页版（PWA）构建：把壳 + 内核组装成仓库根目录的可部署站点
 *
 * 大白话：EdgeOne 之类的静态托管只会把「根目录」当成站点根，所以这里把
 * src/shells/pwa 里的页面与 src/core、src/shared 的源码拼成一份可直接托管的站点，
 * 全部放在仓库根目录：
 *   index.html / offline.html / 404.html / manifest.webmanifest / robots.txt / sitemap.xml
 *   static/…（样式、脚本、图标）
 *   core/…  shared/…（内核与共享模块，ES Module，浏览器原生 import）
 *
 * 为什么内核要复制到根目录：浏览器的 ESM 必须有真实可访问的 URL，
 * 不能再像开发期那样写 ../core/xxx.js 指到源码树里。
 *
 * 用法：
 *   node tools/build-web.js          生成站点（根目录）
 *   node tools/build-web.js --check  只校验（根目录产物与源一致），不写文件
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const SHELL = join(SRC, 'shells', 'pwa');
const CHECK = process.argv.includes('--check');

/** 站点根目录下由构建生成、可以整体重建的路径（其余一律不碰） */
const GENERATED = ['index.html', 'offline.html', '404.html', 'manifest.webmanifest', 'robots.txt', 'sitemap.xml', 'static', 'core', 'shared'];

/** 递归收集目录下所有文件（相对路径，posix 分隔） */
function walk(dir, base = dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, base, acc);
    else acc.push(relative(base, p).split('\\').join('/'));
  }
  return acc;
}

/**
 * 把 app.js 里的相对导入改成站点根可达的路径：
 *   '../core/features/analyzer.js' → './core/features/analyzer.js'
 */
function rewriteImports(code) {
  return code.replace(/(from\s+['"])\.\.\/(?:\.\.\/)*((?:core|shared)\/)/g, '$1./$2');
}

/** 生成全部站点文件（相对路径 → 内容） */
export function buildWeb() {
  const files = new Map();

  // 1) 壳的静态页与资源
  for (const rel of walk(SHELL)) {
    let content = readFileSync(join(SHELL, rel), 'utf8');
    if (rel.endsWith('.js') || rel.endsWith('.html')) content = rewriteImports(content);
    files.set(rel, content);
  }

  // 2) 内核与共享模块（保持目录结构，ESM 原样，只改写引号无关的路径无需动）
  for (const dir of ['core', 'shared']) {
    const base = join(SRC, dir);
    for (const rel of walk(base)) {
      const target = posix.join(dir, rel);
      files.set(target, readFileSync(join(base, rel), 'utf8'));
    }
  }

  return files;
}

/** 主构建 */
export function build({ check = CHECK } = {}) {
  const files = buildWeb();
  const total = [...files.values()].reduce((n, s) => n + Buffer.byteLength(s), 0);

  if (check) {
    const problems = [];
    for (const [rel, content] of files) {
      const p = join(ROOT, rel);
      if (!existsSync(p)) problems.push(`缺产物：${rel}`);
      else if (readFileSync(p, 'utf8') !== content) problems.push(`产物与源不一致：${rel}`);
    }
    for (const rel of GENERATED) {
      if (!existsSync(join(ROOT, rel))) problems.push(`缺产物：${rel}`);
    }
    if (problems.length) {
      for (const p of problems) console.error('✗ ' + p);
      return { ok: false, problems, total };
    }
    console.log(`✓ 网页版产物校验通过：${files.size} 个文件，共 ${(total / 1024).toFixed(1)}KB`);
    return { ok: true, total };
  }

  // 清掉上一轮生成物（只删白名单路径）
  for (const rel of GENERATED) {
    const p = join(ROOT, rel);
    if (existsSync(p)) rmSync(p, { recursive: true, force: true });
  }
  for (const [rel, content] of files) {
    const p = join(ROOT, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
  console.log(`✓ 已生成网页版到仓库根目录：${files.size} 个文件，共 ${(total / 1024).toFixed(1)}KB`);
  return { ok: true, total, count: files.size };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = build();
  process.exit(r.ok ? 0 : 1);
}
