const CACHE_VERSION = 'audit-app-v42';

const APP_SHELL = [
  './index.html',
  './manifest.json',
  './xlsx.full.min.js',
  './icon-192.png',
  './icon-512.png'
];

const OPTIONAL_ASSETS = [];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(async cache => {
        await Promise.allSettled([...APP_SHELL, ...OPTIONAL_ASSETS].map(url => cache.add(url)));
        const indexCached = await cache.match('./index.html');
        if (!indexCached) throw new Error('Required app shell asset was not cached: ./index.html');
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function isOnlineCheck(request) {
  const url = new URL(request.url);
  return url.searchParams.has('online-check');
}

function isChecklistIndex(request) {
  const url = new URL(request.url);
  return url.pathname.endsWith('/checklists/index.json');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || (request.destination === 'document' && request.headers.get('accept')?.includes('text/html'));
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(?:html|js|css|png|jpg|jpeg|webp|svg|ico|json|xlsx|xls)$/i.test(url.pathname);
}

async function getIndexFallback() {
  return (await caches.match('./index.html')) || new Response('Offline app shell is not cached.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      const cache = await caches.open(CACHE_VERSION);
      await cache.put(request, response.clone());
      if (isNavigationRequest(request)) await cache.put('./index.html', response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (isNavigationRequest(request)) return getIndexFallback();
    return new Response('', { status: 504, statusText: 'Offline and response not cached' });
  }
}

async function cacheFirstWithRefresh(request) {
  const cached = await caches.match(request);
  const refresh = fetch(request)
    .then(async response => {
      if (response && response.status === 200 && response.type !== 'opaque') {
        const cache = await caches.open(CACHE_VERSION);
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  const response = cached || await refresh;
  return response || new Response('', { status: 504, statusText: 'Offline and asset not cached' });
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  if (isOnlineCheck(request)) {
    event.respondWith(fetch(request));
    return;
  }

  if (!isSameOrigin(request)) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isChecklistIndex(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstWithRefresh(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
