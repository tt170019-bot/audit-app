const CACHE = 'audit-app-v2';
const ASSETS = [
  '/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      // 각각 개별 캐시 (실패해도 전체 중단 안 됨)
      return Promise.allSettled(ASSETS.map(url =>
        c.add(new Request(url, { redirect: 'follow' })).catch(() => {})
      ));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // POST 요청 및 chrome-extension 무시
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request, { redirect: 'follow' }).then(res => {
        // 유효한 응답만 캐시 (리다이렉트 응답 제외)
        if (res && res.status === 200 && !res.redirected) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // 오프라인 + 캐시 없을 때 index.html 폴백
        return caches.match('/index.html');
      });
    })
  );
});
