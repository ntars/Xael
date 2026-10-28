import { ke, beiKe } from './src/core/liuren/tables.js';
// beiKe(a,b) 语义应为「a 被 b 克」= KE_BY[b]===a
console.log('beiKe(3,0) 金被木克? ', beiKe(3,0), '应为 false');
console.log('beiKe(0,3) 木被金克? ', beiKe(0,3), '应为 true');
console.log('beiKe(1,4) 火被水克? ', beiKe(1,4), '应为 true');
