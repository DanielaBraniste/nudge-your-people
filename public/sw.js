const CACHE_NAME = 'catch-up-reminder-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Store for scheduled notifications
const scheduledNotifications = new Map();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { id, title, body, scheduledTime } = event.data.data;
    const delay = scheduledTime - Date.now();

    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        self.registration.showNotification(title, {
          body: body,
          icon: '/placeholder.svg',
          badge: '/placeholder.svg',
          tag: id,
          requireInteraction: true,
          data: { personId: id },
        });
        scheduledNotifications.delete(id);
      }, delay);

      scheduledNotifications.set(id, timeoutId);
    }
  } else if (event.data.type === 'CANCEL_NOTIFICATION') {
    const { id } = event.data.data;
    const timeoutId = scheduledNotifications.get(id);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
      scheduledNotifications.delete(id);
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Extract person ID from notification data
  const personId = event.notification.data?.personId;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          // Send message to existing window
          client.postMessage({
            type: 'CONFIRM_CATCHUP',
            personId: personId
          });
          return client.focus();
        }
      }
      // If no window is open, open a new one with the personId parameter
      if (clients.openWindow) {
        return clients.openWindow(`/?confirm=${personId}`);
      }
    })
  );
});
