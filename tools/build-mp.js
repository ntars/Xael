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
  code = code.replace(/^export\s+default\s+(async\s+)?function\s+([\w$\u4e00-\u9fa5]+)/gm, (_m, asyncKw, name) => {
    exported.push(`module.exports.${name} = ${name};`);
    return `${asyncKw || ''}function ${name}`;
  });
  // 3) export default 表达式
  code = code.replace(/^export\s+default\s+/gm, 'module.exports.default = ');

  // 4) export async function / function / class / const / let / var
  code = code.replace(/^export\s+(async\s+)?function\s+([\w$\u4e00-\u9fa5]+)/gm, (_m, asyncKw, name) => {
    exported.push(`module.exports.${name} = ${name};`);
    return `${asyncKw || ''}function ${name}`;
  });
  code = code.replace(/^export\s+class\s+([\w$\u4e00-\u9fa5]+)/gm, (_m, name) => {
    exported.push(`module.exports.${name} = ${name};`);
    return `class ${name}`;
  });
  // ★ 名字要允许中文等非 \w 标识符（如 export const 支合 = ...）：
  //   旧写法 \w+ 在中文名上不匹配，会整条漏掉，产物里就会残留 export 关键字 → 小程序/Node 直接语法报错。
  //   这里用「贪婪到 = 或 ; 之前」的宽松捕获，再 trim 名字。
  code = code.replace(/^export\s+(const|let|var)\s+([^=;]+?)\s*=/gm, (_m, kw, rawName) => {
    const name = rawName.trim();
    exported.push(`module.exports.${name} = ${name};`);
    return `${kw} ${name} =`;
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

  // 小程序壳文件拷入。WXSS 的 url() 不支持本地文件（只能网络图 / base64 / <image>），
  //   所以 .wxss 里的图标 url("/static/icons/x.svg") 在构建期替换为内嵌 base64 data URI；
  //   源 SVG 仍是 static/icons/ 单一真源，PWA/uni-app 侧继续用路径引用。
  const shellDir = join(ROOT, 'src', 'shells', 'mp-weixin');
  const iconDir = join(ROOT, 'src', 'shells', 'pwa', 'static', 'icons');
  const icon64 = (name) => {
    const p = join(iconDir, name);
    if (!existsSync(p)) throw new Error(`缺少图标源文件：src/shells/pwa/static/icons/${name}`);
    // 小程序 background-image 的 SVG 解析器很挑：去掉 XML 注释（部分基础库不认），
    //   压成单行再 base64，排除一切非必要字符。
    const svg = readFileSync(p, 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/\s*\n\s*/g, ' ').trim();
    return `url("data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}")`;
  };
  const shellFiles = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else shellFiles.push(p);
    }
  };
  if (existsSync(shellDir)) walk(shellDir);
  for (const f of shellFiles) {
    // 二进制文件（png 等）原样拷贝 —— 绝不能当 UTF-8 文本读写（0x89 会被换成 U+FFFD 损坏）
    if (!/\.(js|json|wxss|wxml|md|txt)$/.test(f)) {
      outputs.set(relative(shellDir, f), readFileSync(f));
      continue;
    }
    let text = readFileSync(f, 'utf8');
    if (f.endsWith('.wxss')) {
      text = text.replace(/url\("\/static\/icons\/([\w.-]+\.svg)"\)/g, (_m, name) => icon64(name));
      // 小程序 WXSS 消毒：剥掉 PWA 专有且 WXSS 不支持（或会打断整段解析）的规则。
      //   ① ::placeholder 伪元素（微信要 placeholder-class；毒化后续规则 → 图标丢失）
      //   ② @media (hover:…) 与 :hover（触屏无意义）
      //   ③ * 通配选择器（WXSS 不支持）
      text = text.replace(/[^{}]*::placeholder[^{]*\{[^}]*\}/g, '');
      text = text.replace(/@media\s*\(hover[^{]*\{(?:[^{}]*\{[^}]*\})*[^{}]*\}/g, '');
      text = text.replace(/[^{}]*:hover[^{]*\{[^}]*\}/g, '');
      text = text.replace(/(?:^|\})\s*\*\s*[^{]*\{[^}]*\}/g, '$1');
      // ④ 底部避让单一真源=每一层（旧仓 v3.1.35 结论）：页面根 .nt-page-safe 不留底，
      //    否则转场舞台不满屏（手势条露白）+ 内容区被双重压缩（「卡片超出屏幕」即此因）。
      //    剥根、保层。
      text = text.replace(/(\.nt-page-safe\s*\{[^}]*?)padding-bottom:\s*var\(--safe-bottom\);?\s*/g, '$1');
      // ⑤ 动画失效修复：WXSS 的 animation 简写中 duration 写 var(--d-…) 时整条声明会被
      //    丢弃（呼吸光环/视差转场/错落入场全部不动）。构建期把 var(--d-*)/var(--ease-*)
      //    展开为字面值 —— 数值与 theme.css 单一真源一致。
      const MOTION_VARS = {
        '--d-press': '120ms', '--d-drawer': '280ms', '--d-page': '320ms',
        '--d-theme': '320ms', '--d-splash': '400ms', '--d-modal-out': '200ms',
        '--d-halo': '4400ms', '--ease-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
      };
      // duration 与 ease 两处 var() 都展开（简写任一位置含 var 都可能在部分基础库整条被丢）
      for (const [k, v] of Object.entries(MOTION_VARS)) {
        text = text.split(`var(${k})`).join(v);
      }
    }
    outputs.set(relative(shellDir, f), text);
  }

  const total = [...outputs.values()].reduce((n, s) => n + Buffer.byteLength(s), 0);

  if (check) {
    const problems = [];
    if (total > SIZE_LIMIT) problems.push(`包体 ${(total / 1024).toFixed(1)}KB 超过 2MB 上限`);
    // 动画 var 残留校验（旧仓 A3 教训）：任何 animation 简写里残留 var() → 整条声明会被 WXSS 丢弃
    for (const [rel, content] of outputs) {
      if (/\.wxss$/.test(rel) && /animation:[^;}]*var\(/.test(content)) problems.push(`${rel} 的 animation 里残留 var()（会被 WXSS 整条丢弃）`);
    }
    if (!existsSync(OUT)) problems.push('产物目录不存在，请先执行 node tools/build-mp.js');
    else {
      for (const [rel, content] of outputs) {
        const p = join(OUT, rel);
        if (!existsSync(p)) problems.push(`缺产物：${rel}`);
        else if (!readFileSync(p).equals(Buffer.from(content))) problems.push(`产物与源不一致：${rel}`);
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
  // project.config.json 以 src/shells/mp-weixin/project.config.json 为单一真源拷入
  //   （compileType 固定 miniprogram）。开发者在微信开发者工具里切「多端应用」模式时，
  //   工具会写入 projectArchitecture: multiPlatform 与 app.miniapp.json/miniapp//i18n/
  //   等多端文件 —— 那是面向 mini-ohos/mini-android 的编译路径，会改变图标/动画/样式的
  //   解析行为。本项目小程序以原生 WXML 为准，多端形态由 src/shells/uniapp 独立承担，
  //   每次重建（rmSync OUT）即自动清掉这些工具生成物并回到普通模式。
  outputs.set('project.config.json', readFileSync(join(ROOT, 'src/shells/mp-weixin/project.config.json'), 'utf8'));
  console.log(`✓ 已生成 dist/mp-weixin：${outputs.size} 个文件，共 ${(total / 1024).toFixed(1)}KB`);
  return { ok: true, total, count: outputs.size };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = build();
  process.exit(r.ok ? 0 : 1);
}
