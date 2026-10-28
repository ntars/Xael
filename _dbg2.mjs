import { liurenChart } from './src/core/liuren/liuren.js';
import { ZHI, GAN } from './src/core/common/constants.js';
import { GAN_WX, ZHI_WX, KE_BY, ke, beiKe, JIGONG } from './src/core/liuren/tables.js';
const r = liurenChart({ y:2020,m:1,d:3,h:0 });
console.log('日', r.干支.日, '时', r.干支.时, '月将', r.月将.名);
console.log('四课', r.四课.map(c=>c.位+c.上).join(','));
console.log('发用', r.发用, '三传', r.三传.map(x=>x.支).join(''));
// 手算：日干=?
const dayGan = r.干支.日[0], dayZhi = r.干支.日[1];
const dayGanIdx = GAN.findIndex(g=>g.z===dayGan);
console.log('日干五行', GAN_WX[dayGanIdx], 'ZHI_WX 申', ZHI_WX[8], 'KE_BY', JSON.stringify(KE_BY));
for (let i=0;i<4;i++){
  const c = r.四课[i];
  const wi = (i===0)?GAN_WX[dayGanIdx]:ZHI_WX[ZHI.findIndex(z=>z.z===c.位)];
  const ws = ZHI_WX[ZHI.findIndex(z=>z.z===c.上)];
  console.log(i+1, c.位+c.上, '位WX',wi,'上WX',ws, '上克下', ke(ws,wi), '下贼上', beiKe(wi,ws));
}
