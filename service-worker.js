const CACHE = "bbb-shell-v24";
const SHELL = ["/", "/index.html", "/styles.css", "/map.css", "/app.js", "/i18n.js", "/profile-menu.js", "/members", "/members.html", "/members.js", "/ratings-overview", "/ratings-overview.html", "/ratings-overview.js", "/pwa.js", "/pwa.css", "/manifest.webmanifest", "/icon.svg", "/icon-192.png", "/icon-512.png"];

// Pages redirects .html URLs to extensionless routes. A followed redirect cannot
// be returned to a navigation with redirect mode "manual". Preserve its body and
// security headers while removing the redirect flag before caching or serving.
function navigationSafe(response) {
  return response.redirected ? new Response(response.body, {
    status: response.status, statusText: response.statusText, headers: response.headers
  }) : response;
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const path of SHELL) {
      const response = await fetch(path, { cache: "reload" });
      if (!response.ok) throw new Error("App shell request failed: " + path);
      await cache.put(path, navigationSafe(response));
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
    if (cached) return navigationSafe(cached);
    const response = navigationSafe(await fetch(request));
    if (response.ok) await cache.put(request, response.clone());
    return response;
  }));
});

