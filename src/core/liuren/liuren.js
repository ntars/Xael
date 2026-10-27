/**
 * src/core/liuren/liuren.js —— 大六壬·时家（月将加占时）（自研，零依赖）
 *
 * 大白话：大六壬把十二地支摆成一个大圆盘（天地两层）。
 * 「月将」= 太阳所在的黄道宫（按中气换将），把它加在占时的地支上就得到天盘；
 * 再从四课（干上神/干阴神/支上神/支阴神）里按「九宗门」规则发用三传，
 * 最后布天将（十二贵人等）——这就是六壬排盘的主体。
 *
 * 口径（通例，docs/CALIBER-NOTES.md 有详表）：
 *   · 月将按中气换（雨水后亥将……大寒后子将）；
 *   · 天盘[x] = (x + 月将序 − 占时支序) mod 12；
 *   · 日干寄宫：甲寅 乙辰 丙巳 戊巳 丁未 己未 庚申 辛戌 壬亥 癸丑；
 *   · 四课 = {干寄宫→其上神→上神之上} 与 {日支→其上神→上神之上}；
 *   · 九宗门发用（优先级）：伏吟→返吟→贼克（上克下元首/下贼上重审）→比用→涉害
 *     （深数不计藏干→孟仲季→缀瑕）→遥克（神克日弹射/日克神蒿矢）→昴星→别责→八专；
 *   · 三传：中传=天盘[初传]、末传=天盘[中传]；
 *   · 贵人：甲戊庚牛羊/乙己鼠猴/丙丁猪鸡/壬癸蛇兔/六辛马虎；
 *     昼（卯~申时）用昼贵、夜（酉~寅）用夜贵；贵临亥子丑寅卯辰顺布、巳午未申酉戌逆布；
 *   · 天将序：贵人 螣蛇 朱雀 六合 勾陈 青龙 天空 白虎 太常 玄武 太阴 天后；
 *   · 23 时夜子归当日（六壬口径）、恒自然日柱。
 */

import { dayGanZhiIndex, hourGanZhi, jieqiSeason } from '../calendar/ganzhi.js';
import { jieqiTable } from '../calendar/jieqi2.js';
import { GAN, ZHI, JIAZI } from '../common/constants.js';

/** 月将表：中气 → 月将支（支序） */
const YUEJIANG = {
  雨水: 11, 春分: 10, 谷雨: 9, 小满: 8, 夏至: 7, 大暑: 6,
  处暑: 5, 秋分: 4, 霜降: 3, 小雪: 2, 冬至: 1, 大寒: 0,
};
const JIANG_NAME = ['神后(子)', '大吉(丑)', '功曹(寅)', '太冲(卯)', '天罡(辰)', '太乙(巳)', '胜光(午)', '小吉(未)', '传送(申)', '从魁(酉)', '河魁(戌)', '登明(亥)'];

/** 日干寄宫（支序） */
const JIGONG = [2, 4, 5, 5, 7, 7, 8, 10, 11, 0]; // 甲寅 乙辰 丙巳 戊巳 丁未 己未 庚申 辛戌 壬亥 癸丑

/** 五行（干序/支序）：0木1火2土3金4水 */
const GAN_WX = [0, 1, 2, 0, 3, 2, 3, 4, 1, 4];
const ZHI_WX = [3, 2, 0, 0, 2, 1, 1, 2, 2, 3, 2, 4];
const KE_XU = [4, 1, 2, 0, 3]; // 水克火 火克金 金克木 木克土 土克水（keXu[x] = 克 x 的五行）
const KE_BY = { 0: 2, 1: 4, 2: 3, 3: 0, 4: 1 }; // x 克的对象

/** 三合局 → 孟仲季（寅申巳亥=孟、子午卯酉=仲、辰戌丑未=季） */
function mengZhongJi(z) { return [2, 5, 8, 11].includes(z) ? 0 : [0, 6, 3, 9].includes(z) ? 1 : 2; }

/** 三刑 */
const XING = { 寅: '巳', 巳: '申', 申: '寅', 丑: '戌', 戌: '未', 未: '丑', 子: '卯', 卯: '子', 辰: '辰', 午: '午', 酉: '酉', 亥: '亥' };
function xingOf(z) { return ZHI[z % 12].z; }
function xingTarget(z) {
  const name = ZHI[z].z;
  const t = { 寅: 2, 巳: 5, 申: 8, 丑: 1, 戌: 10, 未: 7, 子: 0, 卯: 3, 辰: 4, 午: 6, 酉: 9, 亥: 11 };
  const tgt = { 寅: '巳', 巳: '申', 申: '寅', 丑: '戌', 戌: '未', 未: '丑', 子: '卯', 卯: '子', 辰: '辰', 午: '午', 酉: '酉', 亥: '亥' }[name];
  return ZHI.findIndex((x) => x.z === tgt);
}
function isZiXing(z) { return ['辰', '午', '酉', '亥'].includes(ZHI[z].z); }

/** 六冲 */
function chongOf(z) { return (z + 6) % 12; }

/** 五行相克判断：a 克 b ? */
function ke(a, b) { return KE_BY[a] === b; }
/** a 被 b 克 ? */
function beiKe(a, b) { return KE_BY[b] === a; }

/** 月将：找 ≤ 当日的最近中气 */
function yueJiangOf(y, m, d) {
  const target = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  let best = null;
  for (const yy of [y - 1, y]) {
    const t = jieqiTable(yy);
    for (const k in YUEJIANG) {
      if (t[k].text <= target && (!best || t[k].text > best.date)) best = { 名: k, date: t[k].text };
    }
  }
  return YUEJIANG[best.名];
}

/** 贵人：昼夜（卯4~申8=昼、酉9~寅2=夜） */
function guirenIdx(dayGan, isNight) {
  const t = {
    甲: [7, 1], 戊: [7, 1], 庚: [7, 1],   // 牛(丑1) 羊(未7)
    乙: [0, 8], 己: [0, 8],               // 鼠(子0) 猴(申8)
    丙: [11, 9], 丁: [11, 9],             // 猪(亥11) 鸡(酉9)
    壬: [5, 3], 癸: [5, 3],               // 蛇(巳5) 兔(卯3)
    辛: [6, 2],                            // 马(午6) 虎(寅2)
  }[dayGan];
  return isNight ? t[1] : t[0];
}

/** 天将布法：贵人临 haitian（支序），亥子丑寅卯辰(11,0..4)顺、巳午未申酉戌逆 */
function buTianJiang(guiZhi, isNight) {
  const JIANG = ['贵人', '螣蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后'];
  const shun = [11, 0, 1, 2, 3, 4].includes(guiZhi);
  const out = {};
  for (let i = 0; i < 12; i++) {
    const p = shun ? (guiZhi + i) % 12 : ((guiZhi - i) % 12 + 12) % 12;
    out[p] = JIANG[i];
  }
  return out;
}

/**
 * 六壬排盘。
 * @param {Object} input {y,m,d,h}
 */
export function liurenChart(input) {
  const { y, m, d, h = 12 } = input;
  const gzIdx = dayGanZhiIndex(y, m, d); // 23时归当日（六壬口径）
  const dayGz = JIAZI[gzIdx];
  const dayGan = dayGz[0], dayZhi = dayGz[1];
  const hourGz = hourGanZhi(dayGz[0], h);
  const hourZhi = hourGz[1];
  const T = ZHI.findIndex((z) => z.z === hourZhi);
  const M = yueJiangOf(y, m, d);

  // 天盘
  const tian = []; // tian[x] = 天盘在地盘 x 上的神（支序）
  for (let x = 0; x < 12; x++) tian[x] = (x + M - T) % 12;

  // 四课
  const dayGanIdx = GAN.findIndex((g) => g.z === dayGan);
  const jigong = JIGONG[dayGanIdx];
  const dayZhiIdx = ZHI.findIndex((z) => z.z === dayZhi);
  const siKe = [
    { 位: jigong, 上: tian[jigong] },
    { 位: tian[jigong], 上: tian[tian[jigong]] },
    { 位: dayZhiIdx, 上: tian[dayZhiIdx] },
    { 位: tian[dayZhiIdx], 上: tian[tian[dayZhiIdx]] },
  ];

  // 判克：课 = 下(位)克上(上神)？
  function keOf(c) {
    const diWX = c.位 < 10 ? (GAN_WX[c.位] !== undefined && c.位 < 12 ? (c.位 < 10 ? GAN_WX[c.位] : ZHI_WX[c.位]) : 0) : ZHI_WX[c.位];
    // 第一课「位」是干寄宫——判克用日干五行（非寄宫支五行）
    return { 下克上: beiKe(c.上, diWX), 上克下: ke(c.上, diWX) };
  }
  // 简化：按位是干（第一课）还是支（其余）
  function keClass(ci, c) {
    const isGan = ci === 0;
    const diWX = isGan ? GAN_WX[dayGanIdx] : ZHI_WX[c.位 % 12];
    const shangWX = ZHI_WX[c.上];
    return { 下贼上: beiKe(shangWX, diWX), 上克下: ke(shangWX, diWX) };
  }

  const fuYin = tian[T] === T; // 伏吟：M==T
  const fanYin = ((M - T) % 12 + 12) % 12 === 6; // 返吟：天盘对冲

  let 三传 = [], 发用名 = '';

  if (fuYin) {
    // 伏吟
    发用名 = '伏吟';
    const g = dayGanIdx % 2 === 0 ? siKe[0].上 : siKe[2].上; // 阳日干上、阴日支上
    let 初 = g;
    if (isZiXing(初)) 初 = dayGanIdx % 2 === 0 ? siKe[2].上 : siKe[0].上;
    const 中 = isZiXing(初) ? chongOf(初) : xingTarget(初);
    let 末 = isZiXing(中) ? chongOf(中) : xingTarget(中);
    if (末 === 初) 末 = chongOf(中);
    三传 = [初, 中, 末];
  } else if (fanYin) {
    发用名 = '返吟';
    // 有克走贼克
    const youKe = keClass(0, siKe[0]).下贼上 || keClass(1, siKe[1]).下贼上 || keClass(2, siKe[2]).下贼上 || keClass(3, siKe[3]).下贼上
      || keClass(0, siKe[0]).上克下 || keClass(1, siKe[1]).上克下 || keClass(2, siKe[2]).上克下 || keClass(3, siKe[3]).上克下;
    if (youKe) {
      // 取贼克初传
      const { 初 } = zeiKe(); const 初x = 初;
      三传 = [初x, chongOf(初x), chongOf(三传[1] !== undefined ? 初x : 初x)];
      // 中=初冲、末=中冲
      三传 = [初x, chongOf(初x), chongOf(chongOf(初x))];
    } else {
      // 无克六日（丁己辛日）驿马取用（井栏）
      const yiMa = { 子: 2, 寅: 8, 戌: 8, 申: 2, 亥: 5, 卯: 5, 未: 5, 巳: 11, 丑: 11, 辰: 2, 午: 2, 酉: 5 };
      const drz = ZHI.findIndex((z) => z.z === dayZhi);
      const yi = { 申: 2, 子: 2, 辰: 2, 寅: 8, 午: 8, 戌: 8, 亥: 5, 卯: 5, 未: 5, 巳: 11, 酉: 11, 丑: 11 }[ZHI[drz].z];
      const 初 = yi;
      if (dayGanIdx === 3 || dayGanIdx === 5 || dayGanIdx === 7) { // 丁己辛×丑未=八专？实际丁未己未八专
        三传 = [siKe[0].上, siKe[0].上, siKe[0].上];
      } else {
        三传 = [初, siKe[2].上, siKe[0].上];
      }
    }
  } else {
    // 贼克法
    const z = zeiKe();
    if (z) { 三传 = [z.初, tian[z.初], tian[tian[z.初]]]; 发用名 = z.名; }
    else {
      // 遥克
      const yk = yaoKe();
      if (yk != null) {
        三传 = [yk, tian[yk], tian[tian[yk]]];
        发用名 = beiKe(GAN_WX[dayGanIdx], ZHI_WX[yk]) ? '弹射' : '蒿矢';
      } else {
        // 别责（四课不全）/昴星/八专
        const quan = siKe[0].上 === siKe[1].上 && siKe[2].上 === siKe[3].上;
        const ganZhiSame = siKe[0].位 === siKe[2].位; // 干支同位=八专
        if (ganZhiSame && siKe[0].上 === siKe[2].上) {
          // 八专
          发用名 = '八专';
          let 初;
          if (dayGanIdx % 2 === 0) 初 = siKe[0].上; // 阳日干上
          else 初 = siKe[3].上; // 阴日支阴
          // 独足
          三传 = [初, siKe[0].上, siKe[0].上];
        } else if (quan) {
          // 别责：刚日=日干合干寄宫上神、柔日=支前三合；中末干上
          发用名 = '别责';
          const HE = { 甲: '己', 乙: '庚', 丙: '辛', 丁: '壬', 戊: '癸', 己: '甲', 庚: '乙', 辛: '丙', 壬: '丁', 癸: '戊' };
          const SANHE = { 亥: '卯', 卯: '未', 未: '亥', 寅: '午', 午: '戌', 戌: '寅', 巳: '酉', 酉: '丑', 丑: '巳', 申: '子', 子: '辰', 辰: '申' };
          let 初;
          if (dayGanIdx % 2 === 0) {
            const heGan = HE[dayGan];
            const heGong = JIGONG[GAN.findIndex((g) => g.z === heGan)];
            初 = tian[heGong];
          } else {
            初 = tian[SANHE[ZHI[dayZhiIdx].z] !== undefined ? ZHI.findIndex((z) => z.z === SANHE[ZHI[dayZhiIdx].z]) : 0];
          }
          三传 = [初, siKe[0].上, siKe[0].上];
        } else {
          // 昴星
          发用名 = '昴星';
          const you = tian[9]; // 天盘酉
          if (dayGanIdx % 2 === 0) {
            // 阳日：初=天盘酉（仰看酉位）、中=支上、末=干上
            三传 = [you, siKe[2].上, siKe[0].上];
          } else {
            // 阴日：初=酉下地盘位、中=干上、末=支上
            const under = tian.findIndex((x) => x === 9);
            三传 = [under, siKe[0].上, siKe[2].上];
          }
        }
      }
    }
  }

  /** 贼克发用 */
  function zeiKe() {
    const cls = siKe.map((c, i) => ({ ...c, i, ...keClass(i, c) }));
    const xiaKeShang = cls.filter((c) => c.下贼上); // 下贼上=重审（先取）
    const shangKeXia = cls.filter((c) => c.上克下); // 上克下=元首
    const pool = xiaKeShang.length ? xiaKeShang : shangKeXia;
    if (!pool.length) return null;
    const 名 = xiaKeShang.length ? (xiaKeShang.length === 1 && !shangKeXia.length ? '重审' : '重审') : '元首';
    if (pool.length === 1) return { 初: pool[0].上, 名 };
    // 比用：与日干阴阳相比
    const dayYang = dayGanIdx % 2 === 0;
    const bi = pool.filter((c) => (c.上 % 2 === 0) === dayYang);
    if (bi.length === 1) return { 初: bi[0].上, 名: '比用' };
    if (bi.length > 1) return sheHai(bi, '比用');
    // 涉害
    return sheHai(pool, '涉害');

    /** 涉害：深数=从上神所临地盘位顺数归本位，途中被本位克的地盘位计数 */
    function sheHai(pool2, tag) {
      const scores = pool2.map((c) => {
        const shang = c.上;
        let cnt = 0;
        for (let x = (shang + 1) % 12; x !== shang; x = (x + 1) % 12) {
          // 实际口径：受克之神所临地盘位起，历数至本位；此处=上神本位（天盘回地盘）——
          // 简化：从上神所临地盘位到上神本支位，途中地盘位克该神计一重
          if (ke(ZHI_WX[x], ZHI_WX[shang]) || beiKe(ZHI_WX[shang], ZHI_WX[x]) === false && false) {
            // 深数=地盘位五行克上神五行
          }
          if (beiKe(ZHI_WX[shang], ZHI_WX[x])) cnt++; // x 克 shang
        }
        return { c, cnt };
      });
      const max = Math.max(...scores.map((s) => s.cnt));
      let cand = scores.filter((s) => s.cnt === max).map((s) => s.c);
      if (cand.length === 1) return { 初: cand[0].上, 名: tag };
      // 孟仲季：取孟
      const meng = cand.filter((c) => mengZhongJi(c.上) === 0);
      if (meng.length >= 1 && meng.length < cand.length) cand = meng;
      else if (meng.length === cand.length && meng.length > 1) {
        // 全孟=见机：取干上（阳日）或支上（阴日）
        const pick = dayGanIdx % 2 === 0 ? cand.find((c) => c.i === 0) : cand.find((c) => c.i === 2);
        if (pick) return { 初: pick.上, 名: '见机' };
      } else if (cand.length > 1 && meng.length === 0) {
        // 察微/缀瑕：取干上（阳日干两课）/支上（阴日支两课）
        const pick = dayGanIdx % 2 === 0 ? cand.find((c) => c.i === 0) : cand.find((c) => c.i === 2);
        if (pick) return { 初: pick.上, 名: '缀瑕' };
      }
      return { 初: cand[0].上, 名: tag };
    }
  }

  /** 遥克：四课上神克日干（弹射）或日干克上神（蒿矢） */
  function yaoKe() {
    const diWX = GAN_WX[dayGanIdx];
    for (const c of siKe) if (ke(ZHI_WX[c.上], diWX)) return c.上;
    for (const c of siKe) if (ke(diWX, ZHI_WX[c.上])) return c.上;
    return null;
  }

  // 贵人与天将
  const isNight = [9, 10, 11, 0, 1, 2].includes(T);
  const gui = guirenIdx(dayGan, isNight);
  const jiang = buTianJiang(gui, isNight);

  // 天将落天盘神位：天将随天盘神（贵人所在天盘位起布）
  const guiTianPos = tian.findIndex((x) => x === gui); // 贵人临地盘位
  const shun = [11, 0, 1, 2, 3, 4].includes(gui);
  const JIANG = ['贵人', '螣蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后'];
  const jiangOnTian = {}; // 天盘神支序 → 天将
  for (let i = 0; i < 12; i++) {
    const pos = shun ? (gui + i) % 12 : ((gui - i) % 12 + 12) % 12;
    jiangOnTian[pos] = JIANG[i];
  }

  return {
    input: { y, m, d, h },
    干支: { 日: dayGz, 时: hourGz },
    月将: { 序: M, 名: JIANG_NAME[M] },
    天地盘: tian.map((x, i) => ({ 地盘: ZHI[i].z, 天盘: ZHI[x].z })),
    四课: siKe.map((c, i) => ({ 课: i + 1, 位: c.位 < 10 ? GAN[c.位].z : ZHI[c.位].z, 上: ZHI[c.上].z })),
    三传: 三传.map((z, i) => ({ 传: ['初', '中', '末'][i], 支: ZHI[z] ? ZHI[z].z : '', 天将: jiangOnTian[z] || '', 遁干: '' })),
    发用: 发用名,
    昼夜: isNight ? '夜' : '昼',
    贵人: ZHI[gui].z,
    口径: '时家六壬；月将中气换；涉害深数不计藏干；23时夜子归当日',
  };
}
