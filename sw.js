const CACHE_NAME = 'english-is-easy-pwa-v5';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './words.js',
  './chatbot-engine.js',
  './app.js',
  './icon.svg',
  './apple-touch-icon.png',
  './icon-512.png',
  './manifest.json',
  './sounds/delete.wav',
  './sounds/error.wav',
  './sounds/hint.wav',
  './sounds/success.wav',
  './sounds/type.wav',
  './sounds/victory.wav'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return networkRes;
      })
      .catch(() => caches.match(event.request))
  );
});
