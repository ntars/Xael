/**
 * static/sw.js —— Service Worker（三级离线兜底，零外部请求）
 *
 * 大白话：第一次访问时把页面与脚本缓存下来，之后断网也能用。
 * 三级兜底：① 网络优先拿最新（导航请求）→ ② 缓存命中 → ③ 离线页。
 * 只处理同源 GET；跨域一概不理（本工具不依赖任何外部接口）。
 */

const CACHE = 'xael-v5';
const PRECACHE = [
  '/',
  '/index.html',
  '/static/theme.css',
  '/static/app.js',
  '/offline.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 导航请求：网络优先 → 缓存 → 离线页
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match(req).then((r) => r || caches.match('/offline.html')))
    );
    return;
  }

  // 静态资源：缓存优先 → 网络并回填
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('/offline.html'));
    })
  );
});
