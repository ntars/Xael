/**
 * src/core/liuyao/liuyao.js —— 六爻·装卦主入口（自研，零依赖）
 *
 * 大白话：给定占卦时刻（或手摇六次背数），先定卦，再把六爻的干支、五行、六亲、
 *   六神、世应、空亡/月破/日冲标出来，最后给飞神伏神与基础断语（持世、动爻、用神现藏）。
 *
 * 起卦（京房铜钱法）：每次三枚铜钱记「背」数——
 *   0 背 = 老阴（×，动）；1 背 = 少阳（静）；2 背 = 少阴（静）；3 背 = 老阳（○，动）。
 *   六次自下而上成六爻。未给背数则按占卦时刻确定性派生：★绝不能用 Math.random——
 *   同一份排盘刷新就变卦是踩过的坑，必须同一时刻永远同一个卦。
 *
 * 依据：京房纳甲、八宫世应、《增删卜易》用神法、飞伏取本宫八纯卦同位。
 * 相关模块：tables.js（八宫/纳甲/六亲/六神/旬空速查）、wangshuai.js（旺衰与分门断语）、
 *           gonggua.js（卦象与互卦）、najia.js（纳甲装配的旧接口，保留兼容）。
 */

import { dayGanZhiIndex, monthGanZhi } from '../calendar/ganzhi.js';
import { JIAZI } from '../common/constants.js';
import {
  GUA_INDEX, yaGanZhi, qinOf, shenOf, xunKongOf, ZHI_WX, YONG, ZHI_Z,
} from './tables.js';

const ZHI = ZHI_Z.join('');

/* ============================== 起卦 ============================== */

/**
 * 无背数时按占卦时刻派生六爻背数（0–3）：31 哈希定种子 + Park–Miller（乘 16807 在 double 内精确）。
 * h 缺省 12，与「无时辰按 12 时」的口径一致。
 */
export function timeBacks(inp) {
  const o = inp || {};
  const s = `${o.y}-${o.m || 1}-${o.d || 1}-${o.h != null ? o.h : 12}`;
  let h = 1;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 2147483647;
  const out = [];
  for (let i = 0; i < 6; i += 1) { h = (h * 16807) % 2147483647; out.push(h % 4); }
  return out;
}

/** 背数 → 六爻 { yin, bian, val }（初→上） */
export function tossToYao(backs, inp) {
  const b6 = backs || timeBacks(inp || {});
  const res = [];
  for (let i = 0; i < 6; i += 1) {
    const b = b6[i];
    const yin = (b === 0 || b === 2);
    const bian = (b === 0 || b === 3);
    res.push({ yin, bian, val: yin ? 0 : 1 });
  }
  return res;
}

/** 三爻位（初→三）→ 八经卦名 */
const TRI_KEY = { '111': '乾', '110': '兑', '101': '离', '100': '震', '011': '巽', '010': '坎', '001': '艮', '000': '坤' };

/**
 * 六爻值（初→上，1 阳 0 阴）→ { 下卦, 上卦, 卦名 }。
 * 卦名走 GUA_INDEX 反查（八宫表已含 64 卦全部上下卦组合），无需另立 64 名表。
 */
export function fromYao(vals) {
  const down = TRI_KEY[vals.slice(0, 3).join('')];
  const up = TRI_KEY[vals.slice(3, 6).join('')];
  const name = Object.keys(GUA_INDEX).find((n) => GUA_INDEX[n].下 === down && GUA_INDEX[n].上 === up) || '';
  return { 下卦: down, 上卦: up, 卦名: name };
}

/* ============================== 飞神伏神 ============================== */

/**
 * 飞伏：用神不现于本卦时，到「本宫八纯卦」同位取伏神，本卦同位之爻为飞神。
 * 飞伏生克决定伏神能否出伏（京房纳甲通用口径）。
 */
export function flyingHidden(info, curGz) {
  const p = info.宫;
  const pureGz = yaGanZhi(p, p);
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  const out = [];
  for (let j = 0; j < 6; j += 1) {
    const fgz = pureGz[j];
    const fWx = ZHI_WX[fgz.charAt(1)];
    const cgz = curGz[j];
    const cWx = ZHI_WX[cgz.charAt(1)];
    let rel;
    if (SHENG[cWx] === fWx) rel = '飞生伏（易出）';
    else if (KE[cWx] === fWx) rel = '飞克伏（受压难出）';
    else if (SHENG[fWx] === cWx) rel = '伏生飞（泄气）';
    else if (KE[fWx] === cWx) rel = '伏克飞（可出）';
    else rel = '比和';
    out.push({
      爻: j + 1,
      飞神: { 干支: cgz, 五行: cWx, 六亲: qinOf(cWx, info.宫五行) },
      伏神: { 干支: fgz, 五行: fWx, 六亲: qinOf(fWx, info.宫五行) },
      飞伏关系: rel,
      同位: info.代 === 0 ? '本宫纯卦，飞伏同位' : '',
    });
  }
  return out;
}

/* ============================== 基础断语 ============================== */
/** 六亲持世断（通用持世歌） */
export const SHI_QIN = {
  兄弟: '兄弟持世：克财耗财，求财交易不利，防口舌破耗。',
  子孙: '子孙持世：无忧无虑，消灾解厄；求官求名反而不利（子孙克官鬼）。',
  父母: '父母持世：辛劳奔波，主文书学业有成，但克子孙、不利求嗣享乐。',
  官鬼: '官鬼持世：忧疑多阻，主疾病官非口舌，然求官求名有利。',
  妻财: '妻财持世：利求财、求妻，财物可成；然父母文书受克。',
};
/** 六神持世断 */
export const SHI_SHEN = {
  青龙: '青龙持世：喜庆吉祥，主喜庆财禄、进人口。',
  朱雀: '朱雀持世：主口舌是非、文书词讼。',
  勾陈: '勾陈持世：纠缠迟滞，主田土争执、旧事未了。',
  螣蛇: '螣蛇持世：虚惊怪疑，主事多纠缠、难以定夺。',
  白虎: '白虎持世：凶丧伤病，主血光孝服、急灾。',
  玄武: '玄武持世：暧昧不明，主盗贼失脱、虚花暗昧。',
};

/** 基础断语：六亲持世 / 六神持世 / 世爻状态 / 动爻 / 用神现藏 */
export function judge(info, lines, yongKey, fh, dongYao) {
  const out = [];
  const shi = lines[info.世 - 1];
  if (shi) {
    if (SHI_QIN[shi.六亲]) out.push({ 类: '持世', 爻: info.世, 项: `${shi.六亲}持世`, 断: SHI_QIN[shi.六亲] });
    if (shi.六神 && SHI_SHEN[shi.六神]) out.push({ 类: '六神', 爻: info.世, 项: `${shi.六神}持世`, 断: SHI_SHEN[shi.六神] });
    if (shi.标记 && shi.标记.trim()) {
      out.push({ 类: '世爻状态', 爻: info.世, 项: `世爻${shi.标记.trim()}`, 断: '（世爻空/破/冲：主自身虚弱或事难落实）' });
    }
  }
  (dongYao || []).forEach((n) => {
    const l = lines[n - 1];
    if (l) {
      out.push({
        类: '动爻', 爻: n, 项: `第${n}爻动（${l.六亲}·${l.六神 || '—'}）`,
        断: '动则为变机，宜看变卦同位之爻与其化出的六亲。',
      });
    }
  });
  if (yongKey && fh) {
    const visible = lines.filter((l) => l.六亲 === yongKey);
    if (visible.length) {
      const marks = visible.filter((l) => l.标记 && l.标记.trim());
      out.push({
        类: '用神',
        爻: visible.map((l) => l.爻),
        项: `${yongKey}现于第${visible.map((l) => l.爻).join('/')}爻`,
        断: marks.length
          ? `用神虽现但临${marks.map((l) => l.标记.trim()).join('、')}，其力受损，事成中有阻。`
          : '用神现于卦中，可直接据其旺衰（月建日辰生克）判断。',
      });
    } else {
      const hid = fh.filter((f) => f.伏神.六亲 === yongKey);
      if (hid.length) {
        hid.forEach((f) => {
          out.push({
            类: '用神',
            爻: f.爻,
            项: `${yongKey}不现，伏于第${f.爻}爻（伏神 ${f.伏神.干支}·${f.伏神.五行}）`,
            断: `飞神 ${f.飞神.干支}（${f.飞神.六亲}）${f.飞伏关系}；须待伏神出伏透出方可论吉凶（简化判断）。`,
          });
        });
      } else {
        out.push({
          类: '用神', 项: `${yongKey}本卦与本宫纯卦皆无`,
          断: '此事无缘或难成之象（属简化判断，深入细则待黄金盘）。',
        });
      }
    }
  }
  return out;
}

/* ============================== 装卦主入口 ============================== */

/**
 * 六爻装卦。
 * @param {object} inp { y, m, d, h?, backs?:[6], 事?:'财运'… }
 *   backs 给定则按给定起卦；否则按占卦时刻确定性起卦。
 */
export function liuyaoChart(inp) {
  const o = inp || {};
  const yao = tossToYao(o.backs, o);
  const benVals = yao.map((x) => x.val);
  const ben = fromYao(benVals);
  const info = GUA_INDEX[ben.卦名];
  if (!info) return { 错误: `未能定位本卦所属八宫：${ben.卦名}` };

  // 变卦：动爻取反
  const bianVals = benVals.slice();
  const 动爻 = [];
  for (let i = 0; i < 6; i += 1) {
    if (yao[i].bian) { 动爻.push(i + 1); bianVals[i] = yao[i].val ? 0 : 1; }
  }
  const bianName = 动爻.length ? fromYao(bianVals).卦名 : null;

  // 纳甲（本卦 + 变卦）
  const gz = yaGanZhi(info.下, info.上);
  const bianInfo = bianName ? GUA_INDEX[bianName] : null;
  const bianGz = bianInfo ? yaGanZhi(bianInfo.下, bianInfo.上) : null;

  // 日干（六神）/ 月建 / 日辰（旺衰·旬空·月破）
  const y = o.y;
  const m = o.m || 1;
  const d = o.d || 1;
  const h = o.h != null ? o.h : 12;
  let dayGan = null; let 月支 = null; let 日支 = null; let 日干支 = null;
  if (y) {
    const idx = dayGanZhiIndex(y, m, d);
    const dayGz = JIAZI[idx];
    日干支 = dayGz.join('');
    dayGan = dayGz[0];
    日支 = dayGz[1];
    月支 = monthGanZhi(y, m, d, h, o.minute)[1];
  }

  // 逐爻：六亲 / 六神 / 空亡 / 月破 / 日冲
  const 空亡 = 日干支 ? xunKongOf(日干支) : [];
  const lines = [];
  for (let j = 0; j < 6; j += 1) {
    const g = gz[j];
    const zhi = g.charAt(1);
    const zWx = ZHI_WX[zhi];
    const shen = dayGan ? shenOf(j, dayGan) : null;
    const qin = qinOf(zWx, info.宫五行);
    const flags = [];
    if (空亡.indexOf(zhi) >= 0) flags.push('空亡');
    if (月支 && zhi === ZHI[(ZHI.indexOf(月支) + 6) % 12]) flags.push('月破');
    if (日支 && zhi === ZHI[(ZHI.indexOf(日支) + 6) % 12]) flags.push('日冲');
    lines.push({
      爻: j + 1,
      阴阳: yao[j].yin ? '阴' : '阳',
      动静: yao[j].bian ? (yao[j].yin ? '老阴(×→阳)' : '老阳(○→阴)') : '静',
      干支: g,
      五行: zWx,
      六亲: qin,
      六神: shen,
      世应: info.世 === j + 1 ? '世' : (info.应 === j + 1 ? '应' : ''),
      标记: flags.join(' '),
    });
  }

  const 用神Key = o.事 ? YONG[o.事] : null;
  const fh = flyingHidden(info, gz);
  const 断语 = judge(info, lines, 用神Key, fh, 动爻);

  return {
    input: { y, m, d, h },
    本卦: ben.卦名,
    变卦: bianName,
    动爻,
    宫: `${info.宫}宫(${info.宫五行})`,
    世: info.世,
    应: info.应,
    上下卦: `下${info.下} 上${info.上}`,
    本卦纳甲: gz,
    变卦纳甲: bianGz,
    变卦宫: bianInfo ? `${bianInfo.宫}宫(${bianInfo.宫五行})` : null,
    爻线: lines,
    伏飞神: fh,
    断语,
    用神: 用神Key ? `${用神Key}（依测事"${o.事}"）` : null,
    日干: dayGan,
    月建: 月支,
    日辰: 日支,
    旬空: 空亡,
    缺料: (!y
      ? '未给占卦日期，六神/旬空/月破/旺衰未定（仅装卦+飞伏）。可补"年/月/日"以定六神与旺衰。'
      : (dayGan ? '' : '日干未定')),
  };
}

export { GUA_INDEX, YONG };
