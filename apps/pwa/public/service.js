// @ts-nocheck

// Cache name for offline content
const CACHE_NAME = "emailthing-offline-v1";
const OFFLINE_URL = "/offline";

// Assets to cache
const STATIC_ASSETS = [
  "/offline",
  // '/index.css',
  "/icon.svg",
  "/manifest.webmanifest",
  "/_bun/static/fonts/inter-latin-400-normal.woff2",
  "/_bun/static/fonts/inter-latin-400-normal.woff",
];

// cache for up to month (so mm/yy)
const THIRD_PARTY_CACHE_NAME = `3rd-party-cache-${new Date().getMonth()}${new Date().getFullYear()}`;
const FONTS_CACHE_NAME = "fonts-v1";

// dont try to be smart for dev
if (CACHE_NAME !== "emailthing-offline-v1") {
  // Install event - cache offline page and static assets
  self.addEventListener("install", (event) => {
    self.skipWaiting();

    event.waitUntil(
      Promise.all([
        caches
          .open(CACHE_NAME)
          .then((cache) =>
            cache.addAll(
              STATIC_ASSETS.filter(
                (e) =>
                  !(
                    e.endsWith(".map") ||
                    e.endsWith(".woff") ||
                    e.endsWith(".woff2") ||
                    e.endsWith("/") ||
                    e.startsWith("../")
                  ),
              ),
            ),
          )
          .catch((e) => console.error(e)),

        caches
          .open(FONTS_CACHE_NAME)
          .then((cache) =>
            cache.addAll([
              "/_bun/static/fonts/inter-latin-wght-normal.woff2",
              "/CalSans-SemiBold.woff2",
            ]),
          )
          .catch((e) => console.error(e)),
      ]),
    );
  });

  self.addEventListener("activate", (event) => {
    self.clients.claim();

    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((e) => ![CACHE_NAME, THIRD_PARTY_CACHE_NAME, FONTS_CACHE_NAME].includes(e))
            .map((cacheName) => caches.delete(cacheName)),
        );
      }),
    );
  });

  // Fetch event - handle offline fallback
  self.addEventListener("fetch", (/** @type {FetchEvent} */ event) => {
    // if (navigator.onLine) return

    if (event.request.mode === "navigate") {
      if (navigator.onLine) {
        event.respondWith(
          (async () => {
            try {
              if (event.request.url === "https://pwa.emailthing.app/") {
                if (await this?.cookieStore?.get("mailboxId")) {
                  return Response.redirect("https://pwa.emailthing.app/mail");
                }
              }
              event.request.signal = AbortSignal.timeout(3_000);
              return await fetch(event.request);
            } catch (error) {
              console.error(error);
            }
            return caches.match(OFFLINE_URL).then((e) => {
              event.request.signal = null;
              return e || fetch(event.request);
            });
          })(),
        );
      } else {
        event.respondWith(caches.match(OFFLINE_URL));
      }
    } else {
      // dont cache non-GET requests
      if (event.request.method !== "GET") return;

      // For non-navigation requests, try network first then cache, except for _bun assets
      const u = new URL(event.request.url);
      if (
        u.pathname.includes("/_bun/") ||
        STATIC_ASSETS.some((e) => u.pathname === e && self.location.origin === u.origin)
      ) {
        return event.respondWith(
          (async () => {
            const match = await caches.match(event.request);
            if (match) return match;

            try {
              const response = await fetch(event.request);
              if (response.ok) {
                if (
                  event.request.url.includes("/_bun/static/fonts/") ||
                  event.request.url.endsWith(".woff2")
                ) {
                  const cache = await caches.open(FONTS_CACHE_NAME);
                  await cache.put(event.request, response.clone());
                } else {
                  const cache = await caches.open(CACHE_NAME);
                  await cache.put(event.request, response.clone());
                }
              }
              return response;
            } catch (error) {
              const match = await caches.match(event.request);
              if (match) return match;
              return fetch(event.request);
            }
          })(),
        );
      }
      // a few domains which can be cached (but only for fallback)
      const domains = [
        "cloudflare-dns.com",
        "emailthing.app",
        "svgl.app",
        "www.gravatar.com",
        "riskymh.dev",
      ];
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
