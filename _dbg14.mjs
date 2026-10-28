import { liurenChart } from './src/core/liuren/liuren.js';
const r=liurenChart({y:2020,m:7,d:3,h:13});
console.log('月将',r.月将,'时',r.干支.时,'日',r.干支.日);
console.log('四课',r.四课.map(c=>c.位+c.上).join(','));
console.log('发用',r.发用,'三传',r.三传.map(x=>x.支).join(''));
