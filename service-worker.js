const CACHE_NAME = "amann-patisserie-v1";
const urlsToCache = ["/", "/static/js/main.chunk.js", "/static/js/bundle.js", "/manifest.json"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
