const CACHE_NAME = 'audit-app-shell';

const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './xlsx.full.min.js',
  './jszip.min.js',
  './audit-rules.js',
  './audit-store.js',
  './checklist-source.js',
  './supabase-client.js',
  './supabase-auth.js',
  './registrants.js',

  // Local font for offline use
  './fonts/PretendardVariable.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('audit-app-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if(networkResponse.ok){
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request).then(cachedResponse => {
        if(cachedResponse) return cachedResponse;
        if(event.request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      }))
  );
});
