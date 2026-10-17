const CACHE = "bbb-shell-v18";
const SHELL = ["/", "/index.html", "/styles.css", "/map.css", "/app.js", "/i18n.js", "/pwa.js", "/pwa.css", "/manifest.webmanifest", "/icon.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const path of SHELL) {
      const response = await fetch(path, { cache: "reload" });
      if (!response.ok) throw new Error("App shell request failed: " + path);
      await cache.put(path, response);
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((key) => key.startsWith("bbb-shell-") && key !== CACHE).map((key) => caches.delete(key)))
  ).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !SHELL.includes(url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  }));
});

