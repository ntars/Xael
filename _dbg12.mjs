import { ke, beiKe, ZHI_WX, GAN_WX } from './src/core/liuren/tables.js';
// 申卯：位=申(8)→金(3)；上=卯(3)→木(0)
const wi=ZHI_WX[8], ws=ZHI_WX[3];
console.log('wi',wi,'ws',ws);
console.log('上克下 ke(ws,wi)', ke(ws,wi), '应false');
console.log('下贼上 beiKe(wi,ws)=位被上克', beiKe(wi,ws), '应true');
