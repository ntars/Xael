// 由 tools/build-mp.js 自 src/core/liuren/fayong.js 生成，请勿手改
/**
 * src/core/liuren/fayong.js —— 大六壬九宗门发三传（自研，零依赖）
 *
 * 大白话：从四课里挑出「初传」的九套规则，按优先级：
 *   伏吟 → 返吟 → 贼克（下贼上=重审 / 上克下=元首）→ 比用 → 涉害（深数→见机→缀瑕）
 *   → 遥克（弹射/蒿矢）→ 别责 → 昴星 → 八专。
 * 三传 = 初传 → 天盘[初传] → 天盘[天盘[初传]]（伏吟返吟除外）。
 */

const { ZHI } = require('../common/constants.js');
const { GAN_WX, ZHI_WX, JIGONG, mengZhongJi, xingTarget, isZiXing, chongOf, ke, beiKe } = require('./tables.js');

/**
 * 发三传主入口。
 * @param {Object} ctx {tian, siKe, dayGan, dayGanIdx, dayZhiIdx, M, T}
 * @returns {{三传:number[], 发用:string}}
 */
function faSanChuan(ctx) {
  const { tian, siKe, dayGan, dayGanIdx, dayZhiIdx, M, T } = ctx;
  const fuYin = M === T;
  const fanYin = ((M - T) % 12 + 12) % 12 === 6;

  /** 课判克：下(位)贼上(上神) / 上克下 */
  function keClass(ci, c) {
    const isGan = ci === 0;
    const diWX = isGan ? GAN_WX[dayGanIdx] : ZHI_WX[c.位 % 12];
    const shangWX = ZHI_WX[c.上];
    return { 下贼上: beiKe(shangWX, diWX), 上克下: ke(shangWX, diWX) };
  }

  /** 贼克发用（含比用/涉害链） */
  function zeiKe() {
    const cls = siKe.map((c, i) => ({ ...c, i, ...keClass(i, c) }));
    const xiaKeShang = cls.filter((c) => c.下贼上);
    const shangKeXia = cls.filter((c) => c.上克下);
    const pool = xiaKeShang.length ? xiaKeShang : shangKeXia;
    if (!pool.length) return null;
    const 名 = xiaKeShang.length ? '重审' : '元首';
    if (pool.length === 1) return { 初: pool[0].上, 名 };
    // 比用：与日干阴阳相比
    const dayYang = dayGanIdx % 2 === 0;
    const bi = pool.filter((c) => (c.上 % 2 === 0) === dayYang);
    if (bi.length === 1) return { 初: bi[0].上, 名: '比用' };
    if (bi.length > 1) return sheHai(bi, '比用');
    return sheHai(pool, '涉害');

    /** 涉害：深数=从上神所临地盘位顺数归本位，途中被该位克上神的地盘位计一重（不计藏干） */
    function sheHai(pool2, tag) {
      const scores = pool2.map((c) => {
        const shang = c.上;
        let cnt = 0;
        for (let x = (shang + 1) % 12; x !== shang; x = (x + 1) % 12) {
          if (ke(ZHI_WX[x], ZHI_WX[shang])) cnt++;
        }
        return { c, cnt };
      });
      const max = Math.max(...scores.map((s) => s.cnt));
      let cand = scores.filter((s) => s.cnt === max).map((s) => s.c);
      if (cand.length === 1) return { 初: cand[0].上, 名: tag };
      const meng = cand.filter((c) => mengZhongJi(c.上) === 0);
      if (meng.length >= 1 && meng.length < cand.length) cand = meng;
      else if (meng.length === cand.length && meng.length > 1) {
        const pick = dayGanIdx % 2 === 0 ? cand.find((c) => c.i === 0) : cand.find((c) => c.i === 2);
        if (pick) return { 初: pick.上, 名: '见机' };
      } else if (cand.length > 1 && meng.length === 0) {
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

  if (fuYin) {
    // 伏吟：阳日干上、阴日支上；自刑换；中=初刑、末=中刑；自刑取冲；末==初取中冲
    let 初 = dayGanIdx % 2 === 0 ? siKe[0].上 : siKe[2].上;
    if (isZiXing(初)) 初 = dayGanIdx % 2 === 0 ? siKe[2].上 : siKe[0].上;
    const 中 = isZiXing(初) ? chongOf(初) : xingTarget(初);
    let 末 = isZiXing(中) ? chongOf(中) : xingTarget(中);
    if (末 === 初) 末 = chongOf(中);
    return { 三传: [初, 中, 末], 发用: '伏吟' };
  }

  if (fanYin) {
    // 返吟：有克走贼克（中=初冲、末=中冲）；无克六日驿马取用（井栏）
    const youKe = siKe.some((c, i) => keClass(i, c).下贼上 || keClass(i, c).上克下);
    if (youKe) {
      const z = zeiKe();
      if (z) return { 三传: [z.初, chongOf(z.初), chongOf(chongOf(z.初))], 发用: '返吟' };
    }
    // 无克六日（丁己辛日）：日支驿马取用；丁未己未为八专（中末皆干上）
    const yi = { 申: 2, 子: 2, 辰: 2, 寅: 8, 午: 8, 戌: 8, 亥: 5, 卯: 5, 未: 5, 巳: 11, 酉: 11, 丑: 11 }[ZHI[dayZhiIdx].z];
    if ([3, 5, 7].includes(dayGanIdx) && ['丑', '未'].includes(ZHI[dayZhiIdx].z)) {
      return { 三传: [siKe[0].上, siKe[0].上, siKe[0].上], 发用: '八专' };
    }
    return { 三传: [yi, siKe[2].上, siKe[0].上], 发用: '返吟' };
  }

  // 常规：贼克 → 遥克 → 八专 → 别责 → 昴星
  const z = zeiKe();
  if (z) return { 三传: [z.初, tian[z.初], tian[tian[z.初]]], 发用: z.名 };

  const yk = yaoKe();
  if (yk != null) {
    return { 三传: [yk, tian[yk], tian[tian[yk]]], 发用: ke(GAN_WX[dayGanIdx], ZHI_WX[yk]) ? '蒿矢' : '弹射' };
  }

  const quan = siKe[0].上 === siKe[1].上 && siKe[2].上 === siKe[3].上;
  const ganZhiSame = siKe[0].位 === siKe[2].位;
  if (ganZhiSame && siKe[0].上 === siKe[2].上) {
    // 八专：阳日干上、阴日支阴；独足=初==干上
    const 初 = dayGanIdx % 2 === 0 ? siKe[0].上 : siKe[3].上;
    return { 三传: [初, siKe[0].上, siKe[0].上], 发用: '八专' };
  }
  if (quan) {
    // 别责：刚日=日干合干寄宫上神、柔日=支前三合；中末皆干上
    const HE = { 甲: '己', 乙: '庚', 丙: '辛', 丁: '壬', 戊: '癸', 己: '甲', 庚: '乙', 辛: '丙', 壬: '丁', 癸: '戊' };
    const SANHE = { 亥: '卯', 卯: '未', 未: '亥', 寅: '午', 午: '戌', 戌: '寅', 巳: '酉', 酉: '丑', 丑: '巳', 申: '子', 子: '辰', 辰: '申' };
    let 初;
    if (dayGanIdx % 2 === 0) {
      const heGan = HE[dayGan];
      const heGong = JIGONG[['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].indexOf(heGan)];
      初 = tian[heGong];
    } else {
      初 = tian[ZHI.findIndex((z) => z.z === SANHE[ZHI[dayZhiIdx].z])];
    }
    return { 三传: [初, siKe[0].上, siKe[0].上], 发用: '别责' };
  }
  // 昴星：阳日初=天盘酉、中=支上、末=干上；阴日初=酉下地盘位、中=干上、末=支上
  const you = tian[9];
  if (dayGanIdx % 2 === 0) {
    return { 三传: [you, siKe[2].上, siKe[0].上], 发用: '昴星' };
  }
  const under = tian.findIndex((x) => x === 9);
  return { 三传: [under, siKe[0].上, siKe[2].上], 发用: '昴星' };
}


module.exports.faSanChuan = faSanChuan;
