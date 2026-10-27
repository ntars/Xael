// 由 tools/build-mp.js 自 src/core/liuren/tianjiang.js 生成，请勿手改
/**
 * src/core/liuren/tianjiang.js —— 大六壬天将布法（自研，零依赖）
 *
 * 大白话：十二天将（贵人、螣蛇、朱雀……）围着天盘排布。
 * 贵人按日干+昼夜定（甲戊庚牛羊……诀）；贵人落位后，
 * 临亥子丑寅卯辰顺布、临巳午未申酉戌逆布。
 */

/** 天将序（自贵人起顺数） */
const JIANG = ['贵人', '螣蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后'];

/** 贵人诀：[昼贵支序, 夜贵支序]（甲戊庚牛羊/乙己鼠猴/丙丁猪鸡/壬癸蛇兔/六辛马虎） */
const GUIREN = {
  甲: [7, 1], 戊: [7, 1], 庚: [7, 1],
  乙: [0, 8], 己: [0, 8],
  丙: [11, 9], 丁: [11, 9],
  壬: [5, 3], 癸: [5, 3],
  辛: [6, 2],
};

/**
 * 取贵人支序。
 * @param {String} dayGan 日干
 * @param {Boolean} isNight 夜占（酉~寅时）
 */
function guirenIdx(dayGan, isNight) {
  const t = GUIREN[dayGan];
  return isNight ? t[1] : t[0];
}

/**
 * 布十二天将：返回 {天盘神支序 → 天将名}。
 * 贵人临亥子丑寅卯辰(11,0..4)顺布，临巳午未申酉戌逆布。
 */
function buTianJiang(guiZhi) {
  const shun = [11, 0, 1, 2, 3, 4].includes(guiZhi);
  const out = {};
  for (let i = 0; i < 12; i++) {
    const pos = shun ? (guiZhi + i) % 12 : ((guiZhi - i) % 12 + 12) % 12;
    out[pos] = JIANG[i];
  }
  return out;
}


module.exports.guirenIdx = guirenIdx;
module.exports.buTianJiang = buTianJiang;
module.exports.JIANG = JIANG;
