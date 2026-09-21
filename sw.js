/**
 * JK Noova Academy - Service Worker (Offline Cache & PWA Support)
 */

const CACHE_NAME = 'jknoova-cache-v7';
const STATIC_ASSETS = [
  './',
  './index.html',
  './jugadores.html',
  './equipos.html',
  './calendario.html',
  './transporte.html',
  './partido.html',
  './css/style.css',
  './js/data.js',
  './js/i18n.js',
  './js/navbar.js',
  './js/photo-cropper.js',
  './js/asistencia.js',
  './js/tattica.js',
  './js/qr-code.js',
  './js/partido-familia.js',
  './js/jugadores.js',
  './js/equipos.js',
  './js/calendario.js',
  './js/transporte.js',
  './manifest.json',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  // Estrategia Network-First: intentar red primero para tener siempre la última versión,
  // y usar caché si no hay conexión o falla la red.
  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
      }
      return networkResponse;
    }).catch(() => {
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
