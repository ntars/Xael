// 由 tools/build-mp.js 自 src/core/common/constants.js 生成，请勿手改
/**
 * Xael 5.0.0 —— 公共常量模块（自研，零依赖）
 *
 * 大白话：这里放所有术数模块共用的「字表」和「关系表」。
 * 单一真源原则：天干、地支、五行、十二长生等所有字表只在这里定义一次，
 * 其他模块一律从这里 import，避免多处各写一份造成口径漂移。
 */

/** 十天干：字 / 五行 / 阴阳（0=阳, 1=阴） */
const GAN = [
  { z: '甲', wx: '木', yy: 0 },
  { z: '乙', wx: '木', yy: 1 },
  { z: '丙', wx: '火', yy: 0 },
  { z: '丁', wx: '火', yy: 1 },
  { z: '戊', wx: '土', yy: 0 },
  { z: '己', wx: '土', yy: 1 },
  { z: '庚', wx: '金', yy: 0 },
  { z: '辛', wx: '金', yy: 1 },
  { z: '壬', wx: '水', yy: 0 },
  { z: '癸', wx: '水', yy: 1 },
];

/** 十二地支：字 / 五行（本气）/ 阴阳 / 生肖 */
const ZHI = [
  { z: '子', wx: '水', yy: 0, sx: '鼠' },
  { z: '丑', wx: '土', yy: 1, sx: '牛' },
  { z: '寅', wx: '木', yy: 0, sx: '虎' },
  { z: '卯', wx: '木', yy: 1, sx: '兔' },
  { z: '辰', wx: '土', yy: 0, sx: '龙' },
  { z: '巳', wx: '火', yy: 1, sx: '蛇' },
  { z: '午', wx: '火', yy: 0, sx: '马' },
  { z: '未', wx: '土', yy: 1, sx: '羊' },
  { z: '申', wx: '金', yy: 0, sx: '猴' },
  { z: '酉', wx: '金', yy: 1, sx: '鸡' },
  { z: '戌', wx: '土', yy: 0, sx: '狗' },
  { z: '亥', wx: '水', yy: 1, sx: '猪' },
];

/** 六十甲子（按序生成：干序 = i % 10，支序 = i % 12） */
const JIAZI = Array.from({ length: 60 }, (_, i) => GAN[i % 10].z + ZHI[i % 12].z);

/** 地支藏干表（本气 + 中气 + 余气，传统口诀） */
const CANGGAN = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
};

/** 五行相生：A 生 B */
const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
/** 五行相克：A 克 B */
const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

/** 六十甲子纳音表（传统口诀，两柱一组共 30 音） */
const NAYIN = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金',
  '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
  '泉中水', '屋上土', '霹雳火', '松柏木', '长流水',
  '砂石金', '山下火', '平地木', '壁上土', '金箔金',
  '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木',
  '大溪水', '沙中土', '天上火', '石榴木', '大海水',
];

/**
 * 纳音：甲子序 n（0..59）→ 纳音名。
 * 规律：同组两柱共一音，第 k 组（k=0..29）对应 NAYIN[k]，
 * 但组序不是顺排——传统按「金火木土金」五轮排布，直接以口诀表为准。
 */
function nayinOf(jiaziIndex) {
  return NAYIN[Math.floor(((jiaziIndex % 60) + 60) % 60 / 2)];
}

/** 旬空（空亡）：求日柱所在旬的空亡二支。jiaziIndex = 干支序 0..59 */
function xunkongOf(jiaziIndex) {
  // 甲子旬(0-9)空戌亥、甲戌旬(10-19)空申酉、甲申旬(20-29)空午未、
  // 甲午旬(30-39)空辰巳、甲辰旬(40-49)空寅卯、甲寅旬(50-59)空子丑
  const xun = Math.floor(jiaziIndex / 10); // 0..5
  const kong = [10, 8, 6, 4, 2, 0][xun]; // 空亡起支序
  return [ZHI[kong % 12].z, ZHI[(kong + 1) % 12].z];
}

/** 十二长生名（八字用，阴阳干分列口径） */
const CS12_NAMES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

/**
 * 八字十二长生表：日干 → 从某支起的十二状态序列（首项=长生所在支）。
 * 阳干顺行、阴干逆行（传统子平口径）。
 */
const CS12_GAN = {
  甲: ['亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌'],
  乙: ['午', '巳', '辰', '卯', '寅', '丑', '子', '亥', '戌', '酉', '申', '未'],
  丙: ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
  丁: ['酉', '申', '未', '午', '巳', '辰', '卯', '寅', '丑', '子', '亥', '戌'],
  戊: ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
  己: ['酉', '申', '未', '午', '巳', '辰', '卯', '寅', '丑', '子', '亥', '戌'],
  庚: ['巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰'],
  辛: ['子', '亥', '戌', '酉', '申', '未', '午', '巳', '辰', '卯', '寅', '丑'],
  壬: ['申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未'],
  癸: ['卯', '寅', '丑', '子', '亥', '戌', '酉', '申', '未', '午', '巳', '辰'],
};

/**
 * 求日干在某支的十二长生状态名（八字口径）。
 * 做法：在 CS12_GAN[gan] 序列里找到该支的下标，即状态名。
 */
function cs12Of(gan, zhi) {
  const seq = CS12_GAN[gan];
  const i = seq.indexOf(zhi);
  return i >= 0 ? CS12_NAMES[i] : null;
}

/** 十神：以日干为我，求某干与我的关系名。阳阳/阴阴=偏，异性=正 */
function shiShen(dayGan, otherGan) {
  const dg = GAN.find((g) => g.z === dayGan);
  const og = GAN.find((g) => g.z === otherGan);
  const rel = (og.wx === dg.wx) ? '比肩' : (SHENG[dg.wx] === og.wx ? '食神' : (SHENG[og.wx] === dg.wx ? '正印' : (KE[og.wx] === dg.wx ? '七杀' : '正官')));
  // 上面的粗判需要精确化：按五行+阴阳出十神
  const dWx = dg.wx, oWx = og.wx;
  const sameYY = dg.yy === og.yy;
  if (oWx === dWx) return sameYY ? '比肩' : '劫财';
  if (SHENG[dWx] === oWx) return sameYY ? '食神' : '伤官';
  if (SHENG[oWx] === dWx) return sameYY ? '偏印' : '正印';
  if (KE[oWx] === dWx) return sameYY ? '七杀' : '正官';
  if (KE[dWx] === oWx) return sameYY ? '偏财' : '正财';
  return null;
}

/** 胎元：月柱干进一位、支进三位 */
function taiyuanOf(monthGanIdx, monthZhiIdx) {
  return GAN[(monthGanIdx + 1) % 10].z + ZHI[(monthZhiIdx + 3) % 12].z;
}

/** 五鼠遁：由日干求时干。时支序 t（0..11），日干序 g（0..9） */
function wuShuDun(g, t) {
  return (g * 2 + t) % 10;
}

/** 五虎遁：由年干求正月月干。月支序 m（寅=2..丑=1 顺数），年干序 y */
function wuHuDun(y, monthIdxFromYin) {
  // 正月起丙（甲己年）、戊（乙庚）、庚（丙辛）、壬（丁壬）、甲（戊癸）
  const start = [2, 4, 6, 8, 0][y % 5];
  return (start + monthIdxFromYin) % 10;
}

/** 地支三合局（用于旺衰与神煞判断的辅助） */
const SANHE = {
  申子辰: '水', 亥卯未: '木', 寅午戌: '火', 巳酉丑: '金',
};

/** 地支六冲 */
const LIUCHONG = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };

/** 地支六合 */
const LIUHE = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };


module.exports.nayinOf = nayinOf;
module.exports.xunkongOf = xunkongOf;
module.exports.cs12Of = cs12Of;
module.exports.shiShen = shiShen;
module.exports.taiyuanOf = taiyuanOf;
module.exports.wuShuDun = wuShuDun;
module.exports.wuHuDun = wuHuDun;
module.exports.GAN = GAN;
module.exports.ZHI = ZHI;
module.exports.JIAZI = JIAZI;
module.exports.CANGGAN = CANGGAN;
module.exports.SHENG = SHENG;
module.exports.KE = KE;
module.exports.NAYIN = NAYIN;
module.exports.CS12_NAMES = CS12_NAMES;
module.exports.CS12_GAN = CS12_GAN;
module.exports.SANHE = SANHE;
module.exports.LIUCHONG = LIUCHONG;
module.exports.LIUHE = LIUHE;
