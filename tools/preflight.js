/**
 * tools/preflight.js —— 发布前七项自检（一条命令知全部状态）
 *
 * 七项：① 版本号单一真源一致 ② 网页版/小程序产物与源一致 ③ 小程序包体 ≤2MB
 *      ④ 全量测试断言通过 ⑤ 关键文件齐全 ⑥ 文档里的数字与实测一致 ⑦ 多端 appid/版本配置齐全
 *
 * 大白话：文档最容易写「66 项断言」而实际变 98 项，所以这里把文档里的数字
 * 和真实跑出来的数字对一遍，对不上就报错。
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build as buildMp } from './build-mp.js';
import { build as buildWeb } from './build-web.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
function item(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name} —— ${detail}`);
}

// ---- ① 版本 ----
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const ver = pkg.version;
const verSources = [];
const push = (file, needle) => {
  const p = join(ROOT, file);
  if (!existsSync(p)) return verSources.push({ file, ok: false, why: '文件不存在' });
  const txt = readFileSync(p, 'utf8');
  verSources.push({ file, ok: txt.includes(ver), why: txt.includes(ver) ? 'ok' : `未出现 ${ver}` });
};
push('package.json', ver);
push('src/core/common/constants.js', ver);
push('index.html', ver);
push('src/shells/pwa/index.html', ver);
push('manifest.webmanifest', ver);
push('src/shells/pwa/manifest.webmanifest', ver);
push('src/shells/mp-weixin/app.js', ver);
push('README.md', ver);
push('NOTICE', ver);
const verBad = verSources.filter((v) => !v.ok);
item('① 版本单一真源', verBad.length === 0, `${ver}，${verSources.length - verBad.length}/${verSources.length} 处一致${verBad.length ? '，异常：' + verBad.map((v) => v.file).join(',') : ''}`);

// ---- ② 产物一致 ----
const web = buildWeb({ check: true });
const mp = buildMp({ check: true });
item('② 产物与源一致', web.ok && mp.ok, `网页版 ${web.ok ? '一致' : '不一致'}；小程序 ${mp.ok ? '一致' : '不一致'}`);

// ---- ③ 包体 ----
item('③ 小程序包体', mp.total < 2 * 1024 * 1024, `${(mp.total / 1024).toFixed(1)}KB / 2048KB`);

// ---- ④ 测试 ----
let testOut = '';
let testOk = false;
try {
  testOut = execFileSync(process.execPath, [join(ROOT, 'tests', 'run.js')], { encoding: 'utf8' });
  testOk = true;
} catch (e) {
  testOut = (e.stdout || '') + (e.stderr || '');
}
const m = testOut.match(/合计 通过 (\d+) 项，失败 (\d+) 项/);
const assertCount = m ? Number(m[1]) : 0;
const assertFail = m ? Number(m[2]) : 1;
item('④ 全量测试', testOk && assertFail === 0, `${assertCount} 项断言通过，${assertFail} 项失败`);

// ---- ⑤ 关键文件 ----
const KEY = [
  'LICENSE', 'NOTICE', 'README.md', 'README_EN.md', 'package.json',
  'index.html', 'manifest.webmanifest', 'offline.html', '404.html', 'static/sw.js',
  'core/calendar/astronomy.js', 'core/calendar/lunar2.js', 'core/features/analyzer.js',
  'src/shells/mp-weixin/pages/index/index.wxml', 'src/shells/uniapp/pages/index/index.vue',
  'docs/CALIBER-NOTES.md', 'dist/mp-weixin/app.json',
];
const miss = KEY.filter((f) => !existsSync(join(ROOT, f)));
item('⑤ 关键文件齐全', miss.length === 0, miss.length ? `缺：${miss.join(', ')}` : `${KEY.length} 个关键文件均在`);

// ---- ⑥ 文档数字 = 实测 ----
const docFiles = ['README.md', 'README_EN.md', 'docs/CALIBER-NOTES.md', 'NOTICE'];
const claimPatterns = [
  /(\d+)\s*项断言/g,
  /(\d+)\s*assertions/g,
];
const docBad = [];
let claims = 0;
for (const f of docFiles) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  const txt = readFileSync(p, 'utf8');
  for (const re of claimPatterns) {
    for (const mm of txt.matchAll(re)) {
      claims++;
      if (Number(mm[1]) !== assertCount) docBad.push(`${f} 写 ${mm[1]} 项`);
    }
  }
}
item('⑥ 文档数字与实测一致', docBad.length === 0, docBad.length ? docBad.join('；') : `${claims} 处断言数字均等于实测 ${assertCount}`);

// ---- ⑦ 多端配置 ----
const mpCfg = JSON.parse(readFileSync(join(ROOT, 'src/shells/mp-weixin/project.config.json'), 'utf8'));
const uniCfg = JSON.parse(readFileSync(join(ROOT, 'src/shells/uniapp/manifest.json'), 'utf8'));
const appidOk = /^wx[0-9a-f]{16}$/.test(mpCfg.appid) && uniCfg['mp-weixin'].appid === mpCfg.appid;
item('⑦ 多端配置', appidOk && uniCfg.versionName === ver, `appid ${mpCfg.appid}，小程序与 uni-app 一致；versionName ${uniCfg.versionName}`);

// ---- 汇总 ----
const bad = results.filter((r) => !r.ok);
console.log(`\n${bad.length === 0 ? '全部通过' : bad.length + ' 项未通过'}（${results.length} 项检查）`);
process.exit(bad.length ? 1 : 0);
