/**
 * src/core/purple-star/data/flow-stars.js —— 流禄流羊流陀（自研，零依赖）
 *
 * 大白话：紫微问「今年」，要在盘上把流年的禄存、擎羊、陀罗按流年天干临时安一遍，
 *   叫流禄/流羊/流陀。这张表按**流年天干**取禄位，羊在禄前一位、陀在禄后一位。
 *
 * 依据（库内原文）：《紫微斗數全書》三卷本卷二「安流禄流羊流陀诀 论流年太岁」——
 *   「假如己丑流年流禄在午、流羊在未、流陀在巳」——己禄在午（与四柱禄位表同源），
 *   羊在禄前、陀在禄后，与例正合。
 * 「羊陀迭并」判据（卷三）：「如遇羊陀，流年亦庚禄居申，流羊在酉，流陀在未，
 *   是命在卯宫原有酉宫擎羊冲合，流年又遇流羊流陀，谓之羊陀迭并。」
 *
 * 不接的（如实声明）：流昌、流曲、流魁、流钺、流马、流鸾、流喜等通行有诀，
 *   三卷本底本**无**相应安诀——不接，不拿通行说补。
 */

// 十干禄位（与四柱禄位同源；《遁甲演义》/《三命通会·论禄》并同）
export const LU_ZHI = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };
const ZHI_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/**
 * 流年三曜。
 * @param {string} flowGan 流年天干（如 '己'）
 */
export function flowStarsOf(flowGan) {
  const gan = String(flowGan || '').trim();
  const lu = LU_ZHI[gan];
  if (!lu) return null;
  const i = ZHI_ORDER.indexOf(lu);
  const qian = ZHI_ORDER[(i + 1) % 12];
  const hou = ZHI_ORDER[(i + 11) % 12];
  return {
    流年干: gan,
    流禄: lu,
    流羊: qian,
    流陀: hou,
    说明: `${gan}年流禄在${lu}（禄位），流羊在${qian}（禄前）、流陀在${hou}（禄后）——《紫微斗數全書》三卷本卷二·安流禄流羊流陀诀（己丑年例：流禄午、流羊未、流陀巳）`,
    依据: '《紫微斗數全書》三卷本卷二·安流禄流羊流陀诀 论流年太岁',
  };
}

/**
 * 「羊陀迭并」判：本命（生年）擎羊/陀罗所在宫，与流羊/流陀所在宫同宫或对冲。
 * 原文：「命在卯宫原有酉宫擎羊冲合，流年又遇流羊流陀，谓之羊陀迭并」。
 * @param {{羊:string,陀:string}} natal 生年羊陀落宫（支）
 * @param {{流羊:string,流陀:string}} flow flowStarsOf 结果
 */
export function yangTuoDieBing(natal, flow) {
  if (!natal || !flow) return [];
  const chong = (a, b) => (ZHI_ORDER.indexOf(a) + 6) % 12 === ZHI_ORDER.indexOf(b);
  const out = [];
  if (natal.羊 && (natal.羊 === flow.流羊 || chong(natal.羊, flow.流羊))) {
    out.push(`生年擎羊在${natal.羊}，流羊在${flow.流羊}，同宫或冲合——羊陀迭并`);
  }
  if (natal.陀 && (natal.陀 === flow.流陀 || chong(natal.陀, flow.流陀))) {
    out.push(`生年陀罗在${natal.陀}，流陀在${flow.流陀}，同宫或冲合——羊陀迭并`);
  }
  return out.map((x) => ({ 判: x, 依据: '《紫微斗數全書》三卷本卷三·羊陀迭并例' }));
}
