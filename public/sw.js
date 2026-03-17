const CACHE_NAME = 'catch-up-reminder-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// === IndexedDB helpers (localStorage is NOT available in Service Workers) ===
const DB_NAME = 'catchup-notifications';
const STORE_NAME = 'scheduled';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'personId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllScheduled() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putScheduled(notif) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(notif);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteScheduled(personId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(personId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// === Check and fire due notifications ===
async function checkAndFireNotifications() {
  try {
    const notifications = await getAllScheduled();
    const now = Date.now();

    for (const notif of notifications) {
      if (notif.scheduledTime <= now && !notif.fired) {
        // Show the notification
        await self.registration.showNotification(
          `Time to catch up with ${notif.personName}!`,
          {
            body: `Don't forget to ${getMethodText(notif.method)} ${notif.personName}`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: notif.personId,
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: {
              personId: notif.personId,
              personName: notif.personName,
              url: self.registration.scope
            },
          }
        );

        // Mark as fired in IndexedDB
        notif.fired = true;
        await putScheduled(notif);

        // Notify the app to reschedule (if it's open)
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          client.postMessage({
            type: 'NOTIFICATION_FIRED',
            personId: notif.personId
          });
        }
      }
    }
  } catch (err) {
    console.error('SW: Error checking notifications:', err);
  }
}

function getMethodText(method) {
  switch (method) {
    case 'call': return 'call';
    case 'text': return 'text';
    case 'dm': return 'message';
    default: return 'reach out to';
  }
}

// === Lifecycle events ===
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => {
      // Check notifications on activation
      return checkAndFireNotifications();
    })
  );
  self.clients.claim();
});

// Check notifications on every fetch event (SW wake-up opportunity)
self.addEventListener('fetch', (event) => {
  // Fire-and-forget notification check on each fetch
  event.waitUntil(checkAndFireNotifications());

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) return response;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return response;
        });
      })
  );
});

// === Periodic Background Sync (fires even when app is closed, where supported) ===
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkAndFireNotifications());
  }
});

// === Messages from the app ===
self.addEventListener('message', (event) => {
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    event.waitUntil(putScheduled(event.data.data));
  } else if (event.data.type === 'CANCEL_NOTIFICATION') {
    event.waitUntil(deleteScheduled(event.data.data.id));
  } else if (event.data.type === 'CHECK_NOTIFICATIONS') {
    event.waitUntil(checkAndFireNotifications());
  }
});

// === Notification click ===
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const personId = event.notification.data?.personId;
  const url = event.notification.data?.url || self.registration.scope;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.indexOf(self.registration.scope) !== -1 && 'focus' in client) {
          if (personId) {
            client.postMessage({ type: 'CONFIRM_CATCHUP', personId });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(personId ? `${url}?confirm=${personId}` : url);
      }
    })
  );
});
