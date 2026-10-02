/* SyncOut service worker — installability, push, and tickets that open offline.
   Only passes and tickets are kept (venues often have no signal); every other
   page always comes fresh from the network. */
const VERSION = "syncout-v6-3";
const OFFLINE = "/offline.html";
const KEEP = "syncout-tickets";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((c) => c.addAll([OFFLINE, "/icons/icon-192.png", "/icons/badge-96.png"])).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== KEEP).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.mode !== "navigate") return;
  const path = new URL(req.url).pathname;
  const keep = path.startsWith("/tickets/") || path.startsWith("/passes");
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (keep && res.ok) {
          const copy = res.clone();
          caches.open(KEEP).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(async () => (keep && (await caches.match(req))) || caches.match(OFFLINE))
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "SyncOut", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "SyncOut", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/notifications" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && "focus" in c) {
          c.navigate(url).catch(() => {});
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
