// sw.js — Service worker voor offline gebruik van Werkuren Tracker
const CACHE_NAME = "werkuren-cache-v1";
const FILES_TO_CACHE = [
  "werkuren.html",
  "manifest.json",
  "icon-180.png",
  "icon-512.png"
];

// Bij installatie: alle bestanden alvast opslaan in de cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Oude caches opruimen bij een update
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Verzoeken eerst uit de cache halen, anders van internet (en dan bewaren)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // Alleen geldige, eigen-domein responses cachen
          if (response && response.status === 200 && event.request.method === "GET") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // offline en niet in cache: geeft undefined terug
    })
  );
});
