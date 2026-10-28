import { ke, beiKe, ZHI_WX, GAN_WX } from './src/core/liuren/tables.js';
// 申卯：位=金(3) 上=木(0) → 上克下? 木克金=false。下贼上? 金克木 → 应 true
console.log('KE_BY[3]=(金克?)', ke(3,0), '应 true');
