// VYRA Service Worker: App-Shell Caching & Offline Workout Logging Queue (Spec 018 Hardened)
const CACHE_NAME = 'vyra-v2';
const PRECACHE_ASSETS = [
  '/',
  '/today',
  '/program',
  '/you',
  '/session',
  '/exercises',
  '/install',
  '/manifest.webmanifest',
  '/icon.svg',
  '/data/exercise-catalogue.json',
];

// Install: Pre-cache core app shell and full exercise catalogue index
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate for app shell & movement catalogue; Network-First for dynamic APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Offline Movement & Substitution APIs: Stale-While-Revalidate
  if (url.pathname.startsWith('/api/exercises') || url.pathname.startsWith('/api/substitutions')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 2. Health, webhooks, analytics, telemetry: Network only
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 3. Navigation requests: Network first with Cache fallback
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

  // 4. Static assets & catalogue JSON: Stale-While-Revalidate
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
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_OFFLINE_SETS' });
  });
}
