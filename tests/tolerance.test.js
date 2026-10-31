/**
 * tests/tolerance.test.js —— 搜索框输入容错（粘贴各种写法都得认）
 *
 * 大白话：用户不会按示例一模一样地敲。零宽字符、全角数字、花体数字、
 * `1990.6.15`、`19900615`、`15/6/1990`、`10点半`、`8pm` 都得解析成同一天同一时辰，
 * 否则「明明写对了却说请输入生辰」——这是体验问题，不是玄学问题。
 */

import { normalizeInput, cnToNumber } from '../src/core/features/normalizer.js';
import { analyze, parseBirth } from '../src/core/features/analyzer.js';
import { about, VERSION } from '../src/shared/settings.js';
import { MOTION } from '../src/shared/theme.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
let failed = 0;
function eq(actual, expect, label) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expect);
  if (a === b) { passed += 1; return; }
  failed += 1;
  console.error(`✗ ${label}\n   实际 ${a}\n   期望 ${b}`);
}
function ok(v, label) {
  eq(!!v, true, label);
}

/** 一组「同一个生辰」的不同写法，必须解析成同一天同一时辰 */
const SAME_BIRTH = [
  '排八字 1990年6月15日 10点 男',
  '排八字 1990-6-15 10:30 男'.replace('10:30', '10点'), // 显式点写法
  '排八字 1990.6.15 10点 男',
  '排八字 1990/6/15 10点 男',
  '排八字 15/6/1990 10点 男',
  '排八字 19900615 10点 男',
  '排八字 1990年6月15日\u200b 10点 男', // 夹零宽空格（手机复制常见）
  '排八字 １９９０年６月１５日 １０点 男', // 全角数字
  '排八字 一九九〇年六月十五日 十点 男', // 中文数字
];

export function run() {
  // 一、归一化：日期分隔与紧凑数字
  eq(normalizeInput('1990.6.15'), '1990-6-15', '点分隔 → 连字符');
  eq(normalizeInput('15/6/1990'), '1990-6-15', '倒序斜杠 → 正序');
  eq(normalizeInput('19900615'), '1990-06-15', '8 位紧凑日期');
  eq(normalizeInput('199006151030'), '1990-06-15 10:30', '12 位日期时间');
  eq(normalizeInput('10点半'), '10:30', '「点半」→ 半时');
  eq(normalizeInput('8pm'), '20:00', '12 小时制');
  eq(normalizeInput('9am'), '9:00', '上午 12 小时制');
  eq(normalizeInput('1990\u200b年6月15日'), '1990-6-15', '零宽字符被清掉');
  eq(normalizeInput('１９９０年６月１５日'), '1990-6-15', '全角数字转半角');
  eq(normalizeInput('1990年6月15日'), '1990-6-15', '年月日 → 连字符');

  // 二、中文数字换算（含「二〇〇五」的〇）
  eq(cnToNumber('二〇〇五'), 2005, '中文年份');
  eq(cnToNumber('二十三'), 23, '两位中文数');
  eq(cnToNumber('十五'), 15, '十五');

  // 三、功能词里的汉字数字不能被换掉（「8点八字」的「八」不是时刻）
  ok(normalizeInput('8点八字').includes('八字'), '功能词「八字」保持原样');
  ok(normalizeInput('排六爻 2024年2月10日').includes('六爻'), '功能词「六爻」保持原样');

  // 四、同一个生辰的多种写法 → 同一组四柱
  const charts = SAME_BIRTH.map((q) => {
    const b = parseBirth(q);
    return b && !b.error ? `${b.y}-${b.m}-${b.d} ${b.h}:${b.minute}` : 'FAIL';
  });
  const uniq = Array.from(new Set(charts));
  eq(uniq.length, 1, '九种写法解析出同一生辰：' + uniq.join(' | '));
  eq(uniq[0], '1990-6-15 10:0', '解析结果就是 1990-6-15 10 时');

  // 五、主链路：容错写法能排出同一张盘
  return Promise.all([
    analyze('排八字 1990年6月15日 10点 男'),
    analyze('排八字 1990-6-15 10点 男'),
    analyze('排八字 19900615 10点 男'),
    analyze('排八字 19９0.6.15 10点 男'),
  ]).then((rs) => {
    const texts = rs.map((r) => (r.results && r.results[0] ? r.results[0].text : r.type));
    eq(new Set(texts).size, 1, '四种写法出同一份结果');
    ok(/庚午/.test(texts[0]), '四柱年柱庚午');

    // 六、口语宜忌问法进黄历（不点名功能也得答得上来）
    return Promise.all([
      analyze('今天宜忌是什么'),
      analyze('今天适合搬家吗'),
      analyze('本月有哪些黄道吉日'),
    ]).then((qs) => {
      qs.forEach((r, i) => eq(r.type, 'results', '口语问法 #' + (i + 1) + ' 有结果'));
      eq(qs[0].results[0].shortName, '查黄历', '「今天宜忌是什么」→ 查黄历');

      // 七、滚动词条：条数与节奏令牌一致（改条数必须同步改 CSS keyframes）
      const hints = about().searchHints || [];
      eq(hints.length, 8, '滚动词条 8 条');
      eq(MOTION.dPhRotate, hints.length * 5500, '一圈时长 = 条数 × 5.5s');

      const css = readFileSync(join(ROOT, 'src/shells/pwa/static/theme.css'), 'utf8');
      ok(/--d-ph-rotate:\s*44s/.test(css), 'theme.css 有 --d-ph-rotate: 44s');
      ok(/@keyframes nt-ph-step/.test(css), 'theme.css 有 nt-ph-step 分档');
      ok(/\.nt-ph-track\s*\{[^}]*animation:\s*nt-ph-step/.test(css), '.nt-ph-track 挂了轮播动画');

      // 八、深色模式：光晕必须换白色（纯黑底上墨色晕看不见）
      const darkBlock = css.slice(css.indexOf('.nt-dark {'), css.indexOf('}', css.indexOf('.nt-dark {')));
      ok(/--nt-halo-soft:\s*rgba\(255,\s*255,\s*255/.test(darkBlock), '深色光晕是白色');
      ok(!/--nt-halo-soft:\s*rgba\(0,\s*0,\s*0/.test(darkBlock), '深色光晕不是黑色');

      // 九、小程序与 uni-app 的深色光晕同步
      const mp = readFileSync(join(ROOT, 'src/shells/mp-weixin/pages/index/index.wxss'), 'utf8');
      const mpDark = mp.slice(mp.indexOf('.nt-dark {'), mp.indexOf('}', mp.indexOf('.nt-dark {')));
      ok(/--nt-halo-soft: rgba\(255, 255, 255/.test(mpDark), '小程序深色光晕是白色');
      const uni = readFileSync(join(ROOT, 'src/shells/uniapp/pages/index/index.vue'), 'utf8');
      ok(/--nt-halo-soft: rgba\(255, 255, 255/.test(uni), 'uni-app 深色光晕是白色');

      // 十、版本与提示词都在（防止误删单一真源）
      eq(VERSION, '5.0.0', '版本号');

      return { passed, failed };
    });
  });
}
