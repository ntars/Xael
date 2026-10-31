/**
 * tools/audit-invariants.mjs —— 跨模块结构不变量审计
 *
 * 大白话：口径对不对要靠古籍，但「这张盘本身立不立得住」可以机器验——
 *   比如九星该一宫一颗、值符该落在值符宫、十二宫名不能重复、五行百分比该合计 100。
 *   这些东西一旦坏了，输出看着仍然像模像样，比算错更难发现。
 *
 * 本脚本只查「不依赖文献解释的结构事实」，与 check-cites（引用可回溯）、
 *   tests/*（逐条断言）分工不同：它专门兜住「改一处、坏另一处」的连带伤害。
 *
 * 用法：node tools/audit-invariants.mjs
 * 退出码：0 全过；1 有不变量被破坏。
 */

const root = new URL('../src/core/', import.meta.url);
const imp = (p) => import(new URL(p, root).href);

const B = await imp('four-pillars/chart.js');
const Z = await imp('purple-star/chart.js');
const Q = await imp('mystic-gates/hour-chart.js');
const K = await imp('mystic-gates/quarter-chart.js');
const L = await imp('six-ren/chart.js');
const S = await imp('six-lines/cast.js');

const errs = [];
const bad = (m) => { errs.push(m); };

let n = 0;
for (let y = 1990; y <= 1996; y += 1) {
  for (let mo = 1; mo <= 12; mo += 1) {
    for (const d of [3, 11, 19, 27]) {
      for (const h of [0, 6, 12, 18, 23]) {
        n += 1;

        // —— 八字：四柱齐备、五行百分比合计 100（最大余数法，不应出现 99/101）——
        try {
          const c = B.fourPillarsChart({ y, m: mo, d, h, gender: '男' });
          for (const k of ['年', '月', '日', '时']) {
            if (!c.pillars[k] || String(c.pillars[k].干支).length !== 2) bad(`八字·${k}柱缺失 @${y}-${mo}-${d} ${h}时`);
          }
          const sum = Object.values(c['五行']['百分比']).reduce((a, b) => a + b, 0);
          if (sum !== 100) bad(`八字·五行百分比合计 ${sum} @${y}-${mo}-${d} ${h}时`);
        } catch (e) { bad('八字抛错 ' + e.message); }

        // —— 紫微：十二宫名各一、十四主星各在一宫 ——
        try {
          const c = Z.purpleStarChart({ y, m: mo, d, h, gender: '男' });
          if (new Set(c.cells.map((x) => x.宫)).size !== 12) bad(`紫微·宫名重复 @${y}-${mo}-${d}`);
          const stars = c.cells.flatMap((x) => x.主星);
          if (stars.length !== 14) bad(`紫微·主星数 ${stars.length} @${y}-${mo}-${d} ${h}时`);
          if (new Set(stars).size !== 14) bad(`紫微·主星重复 @${y}-${mo}-${d} ${h}时`);
        } catch (e) { bad('紫微抛错 ' + e.message); }

        // —— 奇门时家：星/门/神各不重复；值符星落值符宫、值使门落值使落宫 ——
        try {
          const c = Q.mysticGatesHourChart({ y, m: mo, d, h });
          const uniq = (arr, what) => { if (new Set(arr).size !== arr.length) bad(`奇门·${what}重复 @${y}-${mo}-${d} ${h}时`); };
          uniq(c.cells.filter((x) => x.星).map((x) => x.星), '九星');
          uniq(c.cells.filter((x) => x.门).map((x) => x.门), '八门');
          uniq(c.cells.filter((x) => x.神).map((x) => x.神), '八神');
          const fp = c.cells.find((x) => +x.宫 === +c.值符宫);
          // 天禽寄天芮时该宫星显示「天芮(禽)」，故用包含判断
          if (!fp || !String(fp.星).includes(c.值符)) bad(`奇门·值符星不在值符宫 @${y}-${mo}-${d} ${h}时`);
          const dp = c.cells.find((x) => +x.宫 === +c.值使落宫);
          if (!dp || dp.门 !== c.值使) bad(`奇门·值使门不在值使落宫 @${y}-${mo}-${d} ${h}时`);
        } catch (e) { bad('奇门抛错 ' + e.message); }

        // —— 刻家：十刻齐、刻柱不重复、刻局逐刻差 1（九宫循环）、值使落宫在 1..9 ——
        try {
          const c = K.mysticGatesQuarterChart({ y, m: mo, d, h, min: 7 });
          const list = c['十刻一览'] || [];
          if (list.length !== 10) bad(`刻家·十刻数量 ${list.length} @${y}-${mo}-${d} ${h}时`);
          if (new Set(list.map((x) => x.刻柱)).size !== list.length) bad(`刻家·刻柱重复 @${y}-${mo}-${d} ${h}时`);
          for (let i = 1; i < list.length; i += 1) {
            const diff = (list[i].局数 - list[i - 1].局数 + 9) % 9;
            if (diff !== 1 && diff !== 8) bad(`刻家·刻局序差 ${diff} @${y}-${mo}-${d} ${h}时`);
          }
          if (!(c.值使落宫 >= 1 && c.值使落宫 <= 9)) bad(`刻家·值使落宫 ${c.值使落宫} @${y}-${mo}-${d} ${h}时`);
        } catch (e) { bad('刻家抛错 ' + e.message); }

        // —— 六壬：天盘为十二支的排列、三传三条；天将重复仅在返吟（初末同支）时允许 ——
        try {
          const c = L.sixRenChart({ y, m: mo, d, h });
          if (new Set(c['天地盘'].map((x) => x.天盘)).size !== 12) bad(`六壬·天盘非十二支排列 @${y}-${mo}-${d} ${h}时`);
          if ((c['三传'] || []).length !== 3) bad(`六壬·三传数 ${c['三传'].length} @${y}-${mo}-${d}`);
          const zhi = c['三传'].map((x) => x['支']);
          const jiang = c['三传'].map((x) => x['天将']);
          if (new Set(zhi).size === zhi.length && new Set(jiang).size !== jiang.length) bad(`六壬·三传天将重复 @${y}-${mo}-${d} ${h}时`);
        } catch (e) { bad('六壬抛错 ' + e.message); }

        // —— 六爻：六爻齐、世应各一、六亲在五亲之内 ——
        try {
          const c = S.sixLinesCast({ y, m: mo, d, h });
          const ys = c['爻线'];
          if (ys.length !== 6) bad(`六爻·爻数 ${ys.length} @${y}-${mo}-${d} ${h}时`);
          const shi = ys.filter((x) => x['世应'] === '世').length;
          const ying = ys.filter((x) => x['世应'] === '应').length;
          if (shi !== 1 || ying !== 1) bad(`六爻·世应 ${shi}/${ying} @${y}-${mo}-${d} ${h}时`);
          for (const q of new Set(ys.map((x) => x['六亲']))) {
            if (!['父母', '兄弟', '子孙', '妻财', '官鬼'].includes(q)) bad(`六爻·六亲异常 ${q} @${y}-${mo}-${d}`);
          }
        } catch (e) { bad('六爻抛错 ' + e.message); }
      }
    }
  }
}

if (errs.length) {
  console.log(`样本 ${n}｜不变量失败 ${errs.length}`);
  errs.slice(0, 20).forEach((e) => console.log('  ✗ ' + e));
  process.exit(1);
}
console.log(`✓ 跨模块不变量 —— 样本 ${n} 组｜失败 0`);
