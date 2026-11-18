#!/usr/bin/env node
/**
 * bin/xael.js —— 玄玖灵犀 Xael 命令行入口（5.0.0）
 *
 * 本文件只做「解析参数 → 交给 bin/xael-api.js → 打印」，不碰引擎、不定义字段。
 *   字段契约在 xael-api.js 一处定义，MCP 服务（mcp/server.js）复用它 —— 两边永不脱节。
 *
 * 用法：
 *   xael ask "白玖玖，女，2005年6月9日子时 八字"   # 默认 JSON
 *   xael ask "今日宜忌" --text                    # 与搜索结果页逐字一致的纯文本
 *   xael list                                     # 22 项功能清单
 *   xael schema                                   # ask 返回值的字段契约
 *   xael version                                  # 版本（取自 package.json）
 *
 * 约定：不联网、不写磁盘、除结果外不打印任何东西；错误走 stderr、退出码非 0。
 */
import { ask, list, schema, version } from './xael-api.js';

const USAGE = [
  '用法：',
  '  xael ask "<问题>" [--text]   问一句；默认 JSON，--text 出与界面逐字相同的纯文本',
  '  xael list                    22 项功能清单（key / 名 / 短名 / 触发词）',
  '  xael schema                  ask 返回值的字段契约',
  '  xael version                 版本号',
  '',
  '例：xael ask "白玖玖，女，2005年6月9日子时 八字"',
  '     xael ask "今日宜忌" --text',
].join('\n');

async function main(argv) {
  const args = argv.slice(2);
  let cmd = 'ask';
  if (args.length && ['ask', 'list', 'schema', 'version'].includes(args[0])) cmd = args.shift();
  const asText = args.indexOf('--text') >= 0;
  const rest = args.filter((a) => !a.startsWith('--'));

  if (cmd === 'version') { process.stdout.write(version() + '\n'); return; }
  if (cmd === 'list') { process.stdout.write(JSON.stringify(await list(), null, 2) + '\n'); return; }
  if (cmd === 'schema') { process.stdout.write(JSON.stringify(schema(), null, 2) + '\n'); return; }
  if (cmd === 'ask') {
    const q = rest.join(' ').trim();
    if (!q) { process.stderr.write('缺少问题。例：xael ask "今日宜忌"\n'); process.exitCode = 2; return; }
    const out = await ask(q, asText ? 'text' : 'json');
    process.stdout.write((typeof out === 'string' ? out : JSON.stringify(out, null, 2)) + '\n');
    return;
  }
  process.stdout.write(USAGE + '\n');
}

main(process.argv).catch((e) => {
  process.stderr.write(String((e && e.message) || e) + '\n');
  process.exitCode = 1;
});
