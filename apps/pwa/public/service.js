// @ts-nocheck

// Cache name for offline content
const CACHE_NAME = 'emailthing-offline-v1';
const OFFLINE_URL = '/offline';

// Assets to cache
const STATIC_ASSETS = [
  '/offline',
  '/index.css',
  '/icon.svg',
  '/manifest.webmanifest',
  '/_bun/static/fonts/inter-latin-400-normal.woff2',
  '/_bun/static/fonts/inter-latin-400-normal.woff',
];

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
          cacheNames.filter(e => e !== CACHE_NAME).map(cacheName => caches.delete(cacheName))
        );
      })
    );
  });

  // Fetch event - handle offline fallback
  self.addEventListener('fetch', event => {
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
      // For non-navigation requests, try network first then cache, except for _bun assets
      if (event.request.url.includes('/_bun/') || STATIC_ASSETS.some(e => event.request.url.endsWith(e))) {
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
            return await caches.match(event.request);
          }
        })());
      } else {
        // if (navigator.onLine) {
        //   event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
        // } else {
        //   return event.respondWith((async () =>
        //     (await caches.match(event.request)) || fetch(event.request)
        //   )());
        // }
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
