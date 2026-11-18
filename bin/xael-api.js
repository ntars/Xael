/**
 * bin/xael-api.js —— 对外调用契约层（Xael 5.0.0）
 *
 * 为什么单独一层：命令行（bin/xael.js）与 MCP 服务（mcp/server.js）要吐**同一份**结果，
 *   字段契约只在这里定义一次，两个入口只是「怎么收参数、怎么吐出去」的薄壳。
 *
 * 铁律：本文件不含任何算法、不复制任何术数名词表；全部能力来自 src/core/features/
 *   里的同一个引擎（analyzer + registry），与三端界面走同一份代码。
 * 只读：不联网、不写磁盘、不读环境变量。
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const ANALYSIS_SCHEMA = 'xael/analysis@1';
export const FEATURES_SCHEMA = 'xael/features@1';

// 引擎按需加载：问版本、看契约都不必把内核全部拉起来
let _engine = null;
function engine() {
  if (_engine) return _engine;
  return null; // ESM 动态 import 在异步上下文里做，见 askAsync/list
}

// package.json 是唯一版本真值：这里只读，不另存一份数字
export function version() {
  return String(JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version);
}

/** analyze 返回的拒绝码 → 对外状态词（调用方不必解析中文句子） */
const REJECT_STATUS = {
  birth: 'need_birth',      // 没有出生信息，也不是黄历/万年历这类查询
  lunar: 'invalid_lunar',   // 农历日期不存在（例如那年没有的「闰四月」）
  pillar: 'invalid_pillar', // 四柱查不到对应日期
  solar: 'invalid_solar',   // 公历日期不合法
  nonmeta: 'refused',       // 超出玄学与传统文化范围
  kernel: 'rejected'        // 内核异常（保留值）
};

/**
 * 问一句（异步：内核是 ESM，首次调用时加载）。
 * @param {string} query 大白话输入
 * @param {'json'|'text'} [format]
 * @returns {Promise<object|string>} json 返回契约对象；text 返回**与搜索结果页逐字相同**的字符串
 */
export async function ask(query, format) {
  const q = query == null ? '' : String(query);
  if (!_engine) {
    _engine = {
      analyzer: await import(join(ROOT, 'src/core/features/analyzer.js')),
      registry: await import(join(ROOT, 'src/core/features/registry.js')),
    };
  }
  const E = _engine;
  const r = await E.analyzer.analyze(q);

  // --text / format=text：直接回界面同款文本，不加前缀不改换行 ——
  //   否则「命令行结果 = 界面结果」这句话就不成立。
  let text;
  if (r.type === 'results') {
    text = r.results.map((x) => x.text).join('\n\n');
  } else {
    text = r.message || '';
  }
  if (format === 'text') return text;

  const status = r.type === 'refuse'
    ? (REJECT_STATUS[r.code] || 'rejected')
    : 'ok';

  // sections 仅在多命中并列时有值（与界面「多命中并列」一致）；单块为 null
  let sections = null;
  if (r.type === 'results' && r.results.length >= 2) {
    sections = r.results.map((x) => ({ title: `${x.name} · ${x.shortName}`, text: x.text }));
  }

  return {
    schema: ANALYSIS_SCHEMA,
    version: version(),
    query: q,
    status,
    hits: r.type === 'results' ? r.results.length : 0,
    sections,
    text,
  };
}

/** 22 项功能清单：中文键换成对外稳定的英文键，值一个字都不改 */
export async function list() {
  if (!_engine) {
    _engine = {
      analyzer: await import(join(ROOT, 'src/core/features/analyzer.js')),
      registry: await import(join(ROOT, 'src/core/features/registry.js')),
    };
  }
  const { FEATURES, GROUPS } = _engine.registry;
  const groupOf = new Map();
  for (const g of GROUPS) {
    for (const it of catalogItems(g)) groupOf.set(it.key, g);
  }
  return {
    schema: FEATURES_SCHEMA,
    version: version(),
    count: FEATURES.length,
    features: FEATURES.map((f) => ({
      key: f.key, name: f.name, short: f.shortName, group: f.section || groupOf.get(f.key) || '',
      note: f.note, triggers: f.triggers,
    })),
  };
}

// registry 没有「key→板块」的直接映射时，从 catalog() 里取（避免复制分组表）
let _catalogCache = null;
function catalogItems(g) {
  if (!_catalogCache) {
    // registry.catalog() 是同步导出
    _catalogCache = _engine.registry.catalog();
  }
  const found = _catalogCache.find((x) => x.section === g) || { items: [] };
  return found.items || [];
}

/** 契约自述：AI 先读这个再决定怎么调，比读文档可靠 */
export function schema() {
  return {
    schema: ANALYSIS_SCHEMA,
    fields: {
      schema:   '恒为 "xael/analysis@1"，标识本契约；字段有变时版本号升级',
      version:  '引擎版本（取自 package.json）',
      query:    '原样回显的输入',
      status:   'ok | need_birth | invalid_lunar | invalid_pillar | invalid_solar | refused | rejected',
      hits:     '命中并算出的功能块个数；status != ok 时为 0',
      sections: '多命中并列时的分节（[{title, text}]）；单块或非 results 时为 null',
      text:     '与搜索结果页逐字相同的纯文本结果（或拒绝/追问的提示语）',
    },
    status_meaning: {
      ok:             '正常出结果，直接引用 text；需要结构化时读 sections',
      need_birth:     '命中了功能但连出生信息都没有；按 text 那句话向用户索要，别自己编生辰',
      invalid_lunar:  '农历日期不存在（如那年没有的闰月）；提示用户核对',
      invalid_pillar: '四柱查不到对应日期；提示用户核对干支',
      invalid_solar:  '公历日期不合法；提示用户核对',
      refused:        '超出玄学与传统文化范围；说明本引擎只做术数，不作答',
      rejected:       '内核异常（保留值）；原样转达 text',
    },
  };
}
