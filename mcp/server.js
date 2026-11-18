#!/usr/bin/env node
/**
 * mcp/server.js —— 玄玖灵犀 Xael 的 MCP（Model Context Protocol）服务，stdio 传输（5.0.0）
 *
 * 为什么是 stdio：与主程序「无后端 / 无网络」的对外口径一致，不监听任何端口；
 *   本机 AI（Claude Desktop、Cursor、各类支持 MCP 的客户端）以子进程方式拉起即可用。
 *
 * 与命令行的关系：本文件不实现任何算法，也不定义返回字段 —— 全部转给 bin/xael-api.js。
 *   命令行与 MCP 的输出因此**必然一致**，不存在两份契约。
 *
 * 协议要点（JSON-RPC 2.0，按行分隔、每条消息一行）：
 *   initialize → 回协议版本与 tools 能力；notifications/initialized 无 id，不回包
 *   tools/list → 三个工具：xael_analyze / xael_list_features / xael_schema
 *   tools/call → 结果放在 result.content[0].text，内容为 JSON 字符串（format=text 时是纯文本）
 *   ping       → 空对象
 * 任何未知方法回 -32601，参数错误回 -32602，内部异常回 -32603 并附一句可读原因。
 */
import readline from 'node:readline';
import { ask, list, schema, version } from '../bin/xael-api.js';

const PROTOCOL = '2024-11-05';

const TOOLS = [
  {
    name: 'xael_analyze',
    description: '问玄玖灵犀一句大白话（排八字/紫微/六爻/奇门/大六壬/梅花/飞星/黄历等 22 项），返回本地算出的排盘结果。默认返回 JSON（字段见 xael_schema），format=text 返回与界面逐字相同的纯文本。全部计算在本机完成，不联网。',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '大白话输入，例：「白玖玖，女，2005年6月9日子时 八字」或「今日宜忌」' },
        format: { type: 'string', enum: ['json', 'text'], description: '默认 json；text 为与搜索结果页逐字一致的纯文本' },
      },
      required: ['query'],
    },
  },
  {
    name: 'xael_list_features',
    description: '列出引擎支持的 22 项功能（key / 名称 / 短名 / 分组 / 说明 / 触发词），用于决定该问什么、该怎么写输入。',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'xael_schema',
    description: '返回 xael_analyze 的字段契约与 status 取值含义，先读它再调用可避免解析歧义。',
    inputSchema: { type: 'object', properties: {} },
  },
];

function reply(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}
function fail(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

async function callTool(name, args) {
  args = args || {};
  if (name === 'xael_analyze') {
    if (typeof args.query !== 'string' || !args.query.trim()) throw new Error('缺少 query（要问的那句话）');
    const format = args.format === 'text' ? 'text' : 'json';
    const out = await ask(args.query, format);
    return { content: [{ type: 'text', text: typeof out === 'string' ? out : JSON.stringify(out, null, 2) }] };
  }
  if (name === 'xael_list_features') {
    return { content: [{ type: 'text', text: JSON.stringify(await list(), null, 2) }] };
  }
  if (name === 'xael_schema') {
    return { content: [{ type: 'text', text: JSON.stringify(schema(), null, 2) }] };
  }
  throw new Error('未知工具：' + name);
}

async function handle(msg) {
  const id = msg.id === undefined ? null : msg.id;
  const method = msg.method;

  // 通知（无 id）一律不回包：MCP 客户端会因为「通知收到回包」判定协议错误
  if (msg.id === undefined) return;

  if (method === 'initialize') {
    return reply(id, {
      protocolVersion: PROTOCOL,
      capabilities: { tools: {} },
      serverInfo: { name: 'xael', version: version() },
    });
  }
  if (method === 'ping') return reply(id, {});
  if (method === 'tools/list') return reply(id, { tools: TOOLS });
  if (method === 'tools/call') {
    const p = msg.params || {};
    try {
      return reply(id, await callTool(p.name, p.arguments));
    } catch (e) {
      // 业务异常按 MCP 约定放进 result.isError，让客户端把原因显示给用户，
      //   而不是当成协议错误 —— 协议错误会让客户端直接断连。
      return reply(id, { content: [{ type: 'text', text: String((e && e.message) || e) }], isError: true });
    }
  }
  return fail(id, -32601, '未知方法：' + method);
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
  const s = line.trim();
  if (!s) return;
  let msg;
  try {
    msg = JSON.parse(s);
  } catch {
    return fail(null, -32700, '不是合法 JSON');
  }
  handle(msg).catch((e) => {
    fail(msg && msg.id !== undefined ? msg.id : null, -32603, String((e && e.message) || e));
  });
});
