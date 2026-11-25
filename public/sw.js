// ParkBnB Mobile Progressive Web App Service Worker
// Version: 2.0.0
// Strict Security: NEVER caches private customer data, owner payouts, or authenticated APIs.

const CACHE_NAME = 'parkbnb-shell-v2';

const STATIC_SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // STRICT SECURITY RULE: NEVER CACHE OR INTERCEPT PRIVATE / AUTHENTICATED ROUTES
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/account') ||
    url.pathname.startsWith('/host') ||
    url.pathname.startsWith('/admin')
  ) {
    // Pass directly to network with zero caching
    return;
  }

  // Non-GET requests (POST, PUT, DELETE) must always go to the network
  if (event.request.method !== 'GET') {
    return;
  }

  // Stale-while-revalidate for static public shell
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // Offline fallback for root page
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
