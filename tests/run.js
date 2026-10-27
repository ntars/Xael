/**
 * tests/run.js —— 全量测试入口（Node 直跑，零依赖）
 *
 * 大白话：依次执行所有 *.test.js 文件，统计断言，任一失败即退出码 1。
 * 断言口径：每个测试文件自带 assert/count，本入口只汇总。
 */

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith('.test.js') && f !== 'run.js');

let total = 0;
let failed = 0;

for (const f of files) {
  try {
    const mod = await import('./' + f);
    // 有的测试是异步的（要等 setTimeout / await），先等它自报完成；
    // run 是测试导出的「跑完并取计数」函数，同步测试直接 resolve 当前计数。
    const runner = typeof mod.run === 'function' ? mod.run : null;
    const r = await (runner ? runner() : { passed: mod.passed ?? 0, failed: mod.failed ?? 0 });
    const passed = r.passed ?? 0;
    const failedN = r.failed ?? 0;
    total += passed + failedN;
    failed += failedN;
    if (!runner) console.log(`${f}: 通过 ${passed} 项，失败 ${failedN} 项`);
  } catch (e) {
    failed += 1;
    console.error(`${f}: 执行异常 ${e.message}`);
  }
}

console.log(`\n合计 通过 ${total - failed} 项，失败 ${failed} 项`);
process.exit(failed ? 1 : 0);
