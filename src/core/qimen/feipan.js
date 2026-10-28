/**
 * src/core/qimen/feipan.js —— 奇门遁甲·飞盘（飞宫法，自研，零依赖）
 *
 * 大白话：奇门两大流派。转盘派整盘一起转（本项目时家 qimen.js 即是）；
 * 飞盘派按洛书九宫数序 1→2→3…→9 逐宫飞泊（阳遁顺飞、阴遁逆飞），中五不寄宫、天禽单列。
 * 起局前三步（四柱/定局/布地盘）与转盘完全相同，只有三盘飞布方式不同。
 *
 * 飞盘专属口径（与转盘不同，混算必错）：
 *   · 九星飞序 = 洛书数序：蓬1 芮2 冲3 辅4 禽5 心6 柱7 任8 英9（转盘用的是空间方位环）；
 *   · 八门飞序 = 数序且中五无门：休1 死2 伤3 杜4 开6 惊7 生8 景9；
 *   · 神盘用「九神」（转盘只有八神）：
 *       阳遁 值符·螣蛇·太阴·六合·勾陈·太常·朱雀·九地·九天
 *       阴遁 值符·螣蛇·太阴·六合·白虎·太常·玄武·九地·九天
 *   · 天盘九星自「时干落宫」起按数序飞布；九神同起点，阳顺阴逆；
 *   · 值使落宫 = 自旬首宫起，数至时辰（含中五计数），阳顺阴逆；若落中五，阳遁跳乾六、阴遁跳巽四；
 *     八门自值使落宫沿八宫环（跳过中五）铺开；
 *   · 地盘：戊起局数宫，阳顺阴逆，中五保留不寄坤二（转盘才寄坤二）。
 *
 * 流派与待验（如实标注）：
 *   · 局数走拆补法（复用 qimen.js 定局），另有置闰/超神接气等派，属分歧不合并。
 *   · 八门飞布走八宫环（跳过中五）——与「八门也走九宫数序」派不同，本项目取环序派。
 *   · 中五宫在飞盘有星无门，天盘干随星走；「飞干/伏干」细则未纳入。
 */

import { qimenChart } from './qimen.js';
import { JIAZI } from '../common/constants.js';

/** 飞盘九星序（洛书数序，索引 0 = 宫 1） */
const STAR_FLY = ['天蓬', '天芮', '天冲', '天辅', '天禽', '天心', '天柱', '天任', '天英'];
/** 飞盘八门序（中五无门），GATE_NUM 给本位宫数 */
const GATE_FLY = ['休门', '死门', '伤门', '杜门', '开门', '惊门', '生门', '景门'];
const GATE_NUM = { 休门: 1, 死门: 2, 伤门: 3, 杜门: 4, 开门: 6, 惊门: 7, 生门: 8, 景门: 9 };
/** 九神（阳遁 / 阴遁两套，阴遁用白虎玄武换勾陈朱雀） */
const GOD_YANG = ['值符', '螣蛇', '太阴', '六合', '勾陈', '太常', '朱雀', '九地', '九天'];
const GOD_YIN = ['值符', '螣蛇', '太阴', '六合', '白虎', '太常', '玄武', '九地', '九天'];
/** 三奇六仪序 */
const YI = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
/** 旬首 → 旬首仪 */
const XUN_YI = { 甲子: '戊', 甲戌: '己', 甲申: '庚', 甲午: '辛', 甲辰: '壬', 甲寅: '癸' };
/** 八宫环（跳过中五） */
const RING_YANG = [1, 2, 3, 4, 6, 7, 8, 9];
const RING_YIN = [9, 8, 7, 6, 4, 3, 2, 1];
/** 六十甲子串表（一次算好，避免每例 map） */
const JIAZI_STR = JIAZI.map((x) => x[0] + x[1]);

/** 1..9 环绕：把任意整数折回宫号 */
function w9(x) {
  return ((x - 1) % 9 + 9) % 9 + 1;
}

/** 地盘里某仪的宫号；找不到回 0 */
function palaceOfYi(dipan, yi) {
  for (let p = 1; p <= 9; p += 1) if (dipan[p] === yi) return p;
  return 0;
}

/** 干支串在六十甲子里的序号 */
function jiaziIndex(gz) {
  const s = typeof gz === 'string' ? gz : gz[0] + gz[1];
  return JIAZI_STR.indexOf(s);
}

/**
 * 飞盘奇门排盘。
 * @param {{y:number,m:number,d:number,h:number,阴阳遁?:string,局数?:number}} input
 *   `阴阳遁` / `局数` 可选，用于强制对齐某个范例盘（正常排盘不用传）。
 */
export function qimenFeiChart(input) {
  const base = qimenChart(input);
  const yang = input.阴阳遁 ? input.阴阳遁 === '阳遁' : base['遁'] === '阳遁';
  const ju = input.局数 || Number(String(base['局']).replace(/[^0-9]/g, '').slice(0, 1)) || 1;

  // —— 地盘：戊起局数宫，阳顺阴逆，中五保留 ——
  const pan = {};
  for (let i = 0; i < 9; i += 1) {
    pan[yang ? w9(ju + i) : w9(ju - i)] = YI[i];
  }

  // —— 旬首宫 → 值符星 / 值使门（星本位=宫数、门本位=宫数）——
  const xun = base['旬首'] ? base['旬首'].join('') : '';
  const xunYi = XUN_YI[xun];
  const xunGong = palaceOfYi(pan, xunYi);
  const fuStar = STAR_FLY[xunGong - 1] || null;
  let fuDoor = GATE_FLY.find((g) => GATE_NUM[g] === xunGong) || null;
  if (!fuDoor) fuDoor = '死门'; // 旬首落中五（天禽为值符）→ 值使按通则取死门

  // —— 时干宫：值符星落此宫（时干为甲时用本旬旬首仪代甲，与转盘同规）——
  const shiRaw = base['干支'] && base['干支']['时'];
  const shiGz = Array.isArray(shiRaw) ? shiRaw.join('') : (shiRaw || '');
  const shiGan = shiGz.slice(0, 1);
  const shiGong = palaceOfYi(pan, shiGan === '甲' ? xunYi : shiGan);
  if (!shiGong) throw new Error(`未能定位时干「${shiGan}」所在的地盘宫`);

  // —— 天盘九星：自值符星（时干宫）起，按九宫数序阳顺阴逆 ——
  const fuIdx = STAR_FLY.indexOf(fuStar) + 1;
  const tianPan = {};
  STAR_FLY.forEach((s, k) => {
    const off = k + 1 - fuIdx;
    tianPan[yang ? w9(shiGong + off) : w9(shiGong - off)] = s;
  });

  // —— 八门：值使落宫 = 自旬首宫数至时辰（含中五计数）；落中五则阳跳乾六、阴跳巽四 ——
  const offXun = ((jiaziIndex(shiGz) - jiaziIndex(xun)) % 60 + 60) % 60;
  let shiGongLu = yang ? w9(xunGong + offXun) : w9(xunGong - offXun);
  if (shiGongLu === 5) shiGongLu = yang ? 6 : 4;

  const ring = yang ? RING_YANG : RING_YIN;
  const startIdx = ring.indexOf(shiGongLu);
  const zsPos = GATE_FLY.indexOf(fuDoor);
  const baMen = {};
  GATE_FLY.forEach((g, k) => {
    baMen[ring[((startIdx + (k - zsPos)) % 8 + 8) % 8]] = g;
  });

  // —— 九神：值符随值符星（时干宫），按九宫数序阳顺阴逆 ——
  const gods = yang ? GOD_YANG : GOD_YIN;
  const jiuShen = {};
  gods.forEach((gd, k) => {
    jiuShen[yang ? w9(shiGong + k) : w9(shiGong - k)] = gd;
  });

  // 天盘干：星带本宫地盘干（宫数即该星在本派的固定宫）
  const tianGan = {};
  for (let g = 1; g <= 9; g += 1) {
    tianGan[g] = pan[STAR_FLY.indexOf(tianPan[g]) + 1] || '';
  }

  const cells = [];
  for (let g = 1; g <= 9; g += 1) {
    cells.push({
      宫: g,
      地盘干: pan[g] || '',
      天盘干: tianGan[g] || '',
      星: tianPan[g] || '',
      门: baMen[g] || '中宫无门',
      神: jiuShen[g] || '',
    });
  }

  return {
    时刻: base['时刻'],
    干支: base['干支'],
    遁: yang ? '阳遁' : '阴遁',
    局: `${ju}局`,
    局数: ju,
    节气: base['节气'],
    元: base['元'],
    定局来源: input.局数 ? `强制覆盖（${yang ? '阳' : '阴'}遁${ju}局，用于对齐范例）` : '复用时家拆补定局',
    旬首: xun,
    旬首宫: xunGong,
    值符: fuStar,
    值符星: fuStar,
    值使: fuDoor,
    值使门: fuDoor,
    时干宫: shiGong,
    值使落宫: shiGongLu,
    地盘: pan,
    天盘: tianPan,
    八门: baMen,
    九神: jiuShen,
    cells,
    口径: [
      '飞盘派：九星按洛书数序 蓬1芮2冲3辅4禽5心6柱7任8英9 飞布，阴遁逆飞。',
      '八门按 休1死2伤3杜4开6惊7生8景9 本位飞布，中五无门；值使落中五时阳跳乾六、阴跳巽四。',
      '神盘用九神（阳遁勾陈朱雀、阴遁白虎玄武），与转盘八神不同。',
      '地盘戊起局数宫、中五保留不寄坤二；局数复用时家拆补定局，置闰/超神接气派不合并。',
    ],
  };
}

export { STAR_FLY, GATE_FLY, GATE_NUM, GOD_YANG, GOD_YIN };
