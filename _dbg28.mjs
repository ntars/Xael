import { ZHI } from './src/core/common/constants.js';
import { JIGONG, yueJiangOf, JIANG_NAME } from './src/core/liuren/tables.js';
// 甲戌日 月将 秋分=4（辰）？ 六壬 秋分后 辰将（天罡）
// 甲寄宫寅(2)；天盘[x]=(x+M-T)%12，M=4,T=0
const M=4,T=0; const tian=[];for(let x=0;x<12;x++)tian[x]=((x+M-T)%12+12)%12;
console.log('天盘[子]=',ZHI[tian[0]].z,'(应辰)');
console.log('四课', [[2,tian[2]],[tian[2],tian[tian[2]]],[10,tian[10]],[tian[10],tian[tian[10]]]].map(([a,b])=>ZHI[a].z+ZHI[b].z).join(','));
