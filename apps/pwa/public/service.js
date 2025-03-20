// @ts-nocheck

// Cache name for offline content
const CACHE_NAME = 'emailthing-offline-v1';
const OFFLINE_URL = '/offline';

// Assets to cache
const STATIC_ASSETS = [
  '/offline',
  // '/index.css',
  '/icon.svg',
  '/manifest.webmanifest',
  '/_bun/static/fonts/inter-latin-400-normal.woff2',
  '/_bun/static/fonts/inter-latin-400-normal.woff',
];

// cache for up to month (so mm/yy)
const THIRD_PARTY_CACHE_NAME = `3rd-party-cache-${new Date().getMonth()}${new Date().getFullYear()}`;

// dont try to be smart for dev
if (CACHE_NAME !== 'emailthing-offline-v1') {

  // Install event - cache offline page and static assets
  self.addEventListener('install', event => {
    self.skipWaiting();

    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        const files = STATIC_ASSETS.filter(e =>
          !e.endsWith(".map") &&
          !e.endsWith(".woff") &&
          !e.endsWith(".woff2") &&
          !e.endsWith("/")
        );

        // Add all static assets to cache
        return cache.addAll(files);
      })
    );
  });

  self.addEventListener('activate', event => {
    self.clients.claim();

    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(e => e !== CACHE_NAME && e !== THIRD_PARTY_CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
    );
  });

  // Fetch event - handle offline fallback
  self.addEventListener('fetch', (/** @type {FetchEvent} */ event) => {
    // if (navigator.onLine) return

    if (event.request.mode === 'navigate') {
      if (navigator.onLine) {
        event.respondWith(
          fetch(event.request).catch(() => caches.match(OFFLINE_URL))
        );
      } else {
        event.respondWith(caches.match(OFFLINE_URL));
      }
    } else {
      // dont cache non-GET requests
      if (event.request.method !== 'GET') return;

      // For non-navigation requests, try network first then cache, except for _bun assets
      const u = new URL(event.request.url);
      if (u.pathname.includes('/_bun/') || STATIC_ASSETS.some(e => u.pathname === e && self.location.origin === u.origin)) {
        return event.respondWith((async () => {
          const match = (await caches.match(event.request));
          if (match) return match;

          try {
            const response = await fetch(event.request);
            if (response.ok) {
              const cache = await caches.open(CACHE_NAME);
              await cache.put(event.request, response.clone());
            }
            return response;
          } catch (error) {
            const match = await caches.match(event.request);
            if (match) return match;
            return fetch(event.request);
          }
        })());
      } else {
        // a few domains which can be cached (but only for fallback)
        const domains = [
          'cloudflare-dns.com',
          'emailthing.app',
          'svgl.app',
          'www.gravatar.com',
          'riskymh.dev'
        ];
        if (domains.includes(u.hostname)) {
          if (navigator.onLine) {
            return event.respondWith((async () => {
              try {
                const response = await fetch(Object.assign(event.request, { mode: 'cors' }));
                if (response.ok) {
                  const cache = await caches.open(THIRD_PARTY_CACHE_NAME);
                  await cache.put(event.request, response);
                }
                return response.clone();
              } catch (error) {
                try {
                  return await fetch(event.request);
                } catch (error) {
                  const m = await caches.match(event.request);
                  if (m) return m;
                  return fetch(event.request);
                }
              }
            })());
          } else {
            return event.respondWith((async () =>
              (await caches.match(event.request) || fetch(Object.assign(event.request, { mode: 'cors' })))
            )());
          }
        }
      }
    }
  });
}

self.addEventListener("push", async (event) => {
  if (event.data) {
    const eventData = await event.data.json();
    self.registration.showNotification(eventData.title, {
      body: eventData.body,
      icon: "/logo.png",
      badge: "/badge.png",
      timestamp: Date.now(),
      tag: eventData.url,
      data: {
        url: eventData.url,
      },
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.notification.data.url) {
    event.waitUntil(
      clients
        .openWindow(event.notification.data.url)
        .then((windowClient) => (windowClient ? windowClient.focus() : null)),
    );
  }
});
