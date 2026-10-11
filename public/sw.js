// VYRA Service Worker: App-Shell Caching & Offline Workout Logging Queue
const CACHE_NAME = 'vyra-v1';
const PRECACHE_ASSETS = [
  '/',
  '/today',
  '/program',
  '/you',
  '/session',
  '/install',
  '/manifest.webmanifest',
  '/icon.svg',
];

// Install: Pre-cache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate for app shell, Network-First for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For API/Health/Webhooks, network only
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigation requests: Network first with Cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/today');
        });
      })
    );
    return;
  }

  // Static assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Background Sync for Offline Workout Sets
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workout-sets') {
    event.waitUntil(syncOfflineSets());
  }
});

async function syncOfflineSets() {
  // Dispatches sync event to clients or backend queue
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_OFFLINE_SETS' });
  });
}
