const CACHE_NAME = 'multitracker-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Only cache GET requests for same-origin or CDN assets
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        const fetchAndCache = fetch(event.request).then(response => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        });
        return cached || fetchAndCache;
      })
    )
  );
});
