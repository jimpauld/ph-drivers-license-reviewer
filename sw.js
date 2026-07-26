const CACHE = 'phdlr-shell-v3';
const PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './src/main.js',
  './src/theme.js',
  './src/quiz-engine.js',
  './src/exam-session.js',
  './src/practice-session.js',
  './src/report.js',
  './src/storage-idb.js',
  './questions.json',
  './manifest.webmanifest',
  './icons/icon.svg',
  './signs/stop.svg',
  './signs/no-entry.svg',
  './signs/yield.svg',
  './signs/warning-triangle.svg',
  './signs/informational.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => new Response('', { status: 504, statusText: 'Offline' }));
    })
  );
});
