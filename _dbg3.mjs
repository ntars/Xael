import { faSanChuan } from './src/core/liuren/fayong.js';
import { ZHI, GAN, JIAZI } from './src/core/common/constants.js';
import { GAN_WX, ZHI_WX, ke, beiKe, JIGONG } from './src/core/liuren/tables.js';
// 2020-01-03 0时：日乙巳 月将丑 T=子0
const dayGan='乙', dayGanIdx=1, dayZhiIdx=5, M=1, T=0;
const tian=[]; for(let x=0;x<12;x++) tian[x]=((x+M-T)%12+12)%12;
const jigong=JIGONG[dayGanIdx];
const siKe=[{位:jigong,上:tian[jigong],isGan:true},{位:tian[jigong],上:tian[tian[jigong]]},{位:dayZhiIdx,上:tian[dayZhiIdx]},{位:tian[dayZhiIdx],上:tian[tian[dayZhiIdx]]}];
console.log('jigong',jigong,'siKe',siKe.map(c=>c.位+':'+c.上).join(','));
console.log('日干WX',GAN_WX[dayGanIdx]);
for(let i=0;i<4;i++){const wi=(i===0)?GAN_WX[dayGanIdx]:ZHI_WX[siKe[i].位];const ws=ZHI_WX[siKe[i].上];console.log(i,ke(ws,wi),beiKe(wi,ws), '弹(神克日)',ke(ws,GAN_WX[dayGanIdx]),'蒿(日克神)',beiKe(GAN_WX[dayGanIdx],ws));}
console.log(faSanChuan({tian,siKe,dayGan,dayGanIdx,dayZhiIdx,M,T}));
