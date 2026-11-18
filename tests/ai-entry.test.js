/**
 * tests/ai-entry.test.js —— AI 接入三件套冒烟（bin/xael.js CLI + mcp/server.js + 契约层）
 *
 * 大白话：AI 宿主（命令行 / MCP 客户端）调的是 bin/xael-api.js 这一层，
 *   这里验证：① CLI 四个子命令能跑、字段对；② MCP initialize/tools/list/tools/call 走通；
 *   ③ 契约 status 七值映射正确；④ --text 与界面逐字一致。
 * 全部子进程直跑，零依赖。
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BIN = join(ROOT, 'bin', 'xael.js');
const MCP = join(ROOT, 'mcp', 'server.js');
let passed = 0;
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { passed += 1; }
  else { failed += 1; console.log(`  ✗ ${name}${extra ? ' —— ' + extra : ''}`); }
}
function runBin(args) {
  const r = spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', cwd: ROOT });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '' };
}

// ---- ① CLI version / list / schema ----
const v = runBin(['version']);
ok('version 输出 5.0.0', v.code === 0 && v.out.trim() === '5.0.0', v.out + v.err);

const l = runBin(['list']);
let listOk = false, listCount = 0;
try { const j = JSON.parse(l.out); listOk = j.schema === 'xael/features@1' && Array.isArray(j.features); listCount = j.count || 0; } catch {}
ok('list 契约与清单', l.code === 0 && listOk && listCount === 22, `count=${listCount}`);

const s = runBin(['schema']);
let schemaOk = false, statusKeys = [];
try { const j = JSON.parse(s.out); schemaOk = j.schema === 'xael/analysis@1'; statusKeys = Object.keys(j.status_meaning || {}); } catch {}
ok('schema 契约', s.code === 0 && schemaOk && statusKeys.length === 7, statusKeys.join(','));

// ---- ② CLI ask：ok / need_birth / text 逐字 ----
const a = runBin(['ask', '排八字 1990年6月15日 10点 男']);
let askOk = false, askStatus = '', askHits = -1;
try { const j = JSON.parse(a.out); askOk = j.schema === 'xael/analysis@1'; askStatus = j.status; askHits = j.hits; } catch {}
ok('ask ok + hits', a.code === 0 && askOk && askStatus === 'ok' && askHits === 1, `status=${askStatus} hits=${askHits}`);

const b = runBin(['ask', '排八字']);
let bStatus = '';
try { bStatus = JSON.parse(b.out).status; } catch {}
ok('ask 缺生辰 → need_birth', b.code === 0 && bStatus === 'need_birth', bStatus);

const t = runBin(['ask', '今日宜忌', '--text']);
ok('ask --text 与界面同源（含【黄历宜忌】头）', t.code === 0 && t.out.startsWith('【黄历宜忌】'), t.out.slice(0, 24));

// ---- ③ MCP stdio 协议 ----
const msgs = [
  JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
  JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),   // 通知：不回包
  JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
  JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'xael_analyze', arguments: { query: '排六爻 2024年2月10日 12点 男' } } }),
  JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'xael_list_features' } }),
  JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'ping' }),
  '{ not json',                                                              // → -32700
  JSON.stringify({ jsonrpc: '2.0', id: 6, method: 'no/such' }),              // → -32601
].join('\n');
const m = spawnSync(process.execPath, [MCP], { input: msgs, encoding: 'utf8', cwd: ROOT });
const lines = (m.stdout || '').trim().split('\n').filter(Boolean).map((x) => { try { return JSON.parse(x); } catch { return null; } });
const byId = {};
for (const x of lines) if (x && x.id !== undefined && x.id !== null) byId[x.id] = x;

ok('MCP initialize', !!(byId[1] && byId[1].result && byId[1].result.serverInfo && byId[1].result.serverInfo.name === 'xael'));
ok('MCP 通知不回包（回包 = 6 个带 id + 1 个坏 JSON id=null）', lines.filter((x) => x && x.id !== undefined).length === 7);
ok('MCP tools/list 三个工具', !!(byId[2] && byId[2].result && byId[2].result.tools && byId[2].result.tools.length === 3));
let mcOk = false, mcStatus = '';
try { mcOk = !!byId[3] && !byId[3].result.isError; mcStatus = JSON.parse(byId[3].result.content[0].text).status; } catch {}
ok('MCP xael_analyze 出盘', mcOk && mcStatus === 'ok', mcStatus);
ok('MCP list_features count=22', (() => { try { return JSON.parse(byId[4].result.content[0].text).count === 22; } catch { return false; } })());
ok('MCP ping 空对象', !!(byId[5] && byId[5].result && Object.keys(byId[5].result).length === 0));
ok('坏 JSON → -32700', lines.some((x) => x && x.error && x.error.code === -32700));
ok('未知方法 → -32601', !!(byId[6] && byId[6].error && byId[6].error.code === -32601));

// ---- 汇总 ----
console.log(`ai-entry.test.js: 通过 ${passed} 项，失败 ${failed} 项`);
if (typeof process !== 'undefined' && process.exitCode === undefined && failed > 0) process.exitCode = 1;
export async function run() { return { passed, failed }; }
