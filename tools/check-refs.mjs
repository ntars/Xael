/**
 * tools/check-refs.mjs —— 参考文献库（refs-texts/）头部块与结尾完整性检查
 *
 * 大白话：refs-texts/ 里 18 部公版古籍是全项目「依据」的物理载体，
 *   引用能回溯的前提是这些文件本身没被截断、头部元数据没走样。
 *   本脚本只读、不改文件，逐部核对五类头部字段与结尾是否落在句读上。
 *
 * 用法：node tools/check-refs.mjs
 * 退出码：0 全部合规；1 有缺项或截断。
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'refs-texts');
const REQ = ['朝代作者', '公版依据|查证状态', '底本来源|单一真源', '用途', '收录日期'];

const bad = [];
const files = readdirSync(DIR).filter((f) => f.endsWith('.md') && f !== 'README.md').sort();
for (const f of files) {
  const txt = readFileSync(join(DIR, f), 'utf8');
  const head = txt.slice(0, 1200);
  const miss = REQ.filter((k) => !new RegExp(k).test(head));
  if (miss.length) bad.push(`${f}｜头部缺：${miss.join('、')}`);
  const tail = txt.trimEnd().slice(-40);
  // 结尾可能落在句号，也可能带一个收尾的「终／完」字样（如「六壬大全卷十二终」）
  if (!/[。！？」』）】…\d终完]$/.test(tail)) bad.push(`${f}｜结尾疑似截断：…${tail.slice(-20)}`);
}

if (bad.length) {
  console.log(`参考文献库检查失败 ${bad.length} 条：`);
  bad.forEach((b) => console.log('  ✗ ' + b));
  process.exit(1);
}
console.log(`✓ 参考文献库 —— ${files.length} 部头部块一致、结尾完整`);
