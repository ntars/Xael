import { liurenChart } from './src/core/liuren/liuren.js';
const r=liurenChart({y:2021,m:9,d:23,h:0});
console.log('将', r.月将, '课', r.四课.map(c=>c.位+c.上).join(','));
