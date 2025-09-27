const CACHE_NAME = 'welder-pwa-cache-v1';
const urlsToCache = [
  '/', // Изменено
  '/index.html', // Изменено
  '/style.css',
  '/script.js',
  '/indexeddb.js',
  '/manifest.json',
  '/service-worker-registration.js',
  '/icons/icon-192x192.png', // Изменено
  '/icons/icon-512x512.png'  // Изменено
];
// ... остальной код Service Worker

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache:', error);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch(error => {
        console.error('Fetch failed:', error);
        // Можно вернуть оффлайн-страницу, если запрос не удалось выполнить
        // return caches.match('/welder-pwa/offline.html');
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
