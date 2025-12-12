// Service Worker for Push Notifications
// FT Projects - Service Worker

const CACHE_NAME = 'ft-projects-v1';
const APP_NAME = 'FT Projects';

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      // Take control of all clients
      clients.claim(),
    ])
  );
});

// Push event - when notification is received from server
self.addEventListener('push', (event) => {
  let data = {
    title: APP_NAME,
    body: 'لديك إشعار جديد',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'default',
    data: {
      url: '/home',
    },
  };

  // Parse push data if available
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || `notification-${Date.now()}`,
        data: {
          url: payload.data?.url || '/projects',
          projectId: payload.data?.projectId,
          type: payload.data?.type,
          ...payload.data,
        },
      };
    } catch (e) {
      // Use text if JSON parsing fails
      data.body = event.data.text() || data.body;
    }
  }

  // Show notification
  const notificationOptions = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200],
    requireInteraction: true,
    dir: 'rtl',
    lang: 'ar',
    actions: [
      {
        action: 'open',
        title: 'فتح',
        icon: '/icons/open-icon.png',
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: '/icons/close-icon.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close notification
  notification.close();

  // Handle action buttons
  if (action === 'close') {
    return;
  }

  // Determine URL to open
  let urlToOpen = '/home';
  
  if (data.url) {
    urlToOpen = data.url;
  } else if (data.projectId) {
    urlToOpen = `/projects/${data.projectId}`;
  }

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        // Check if we have a window at our origin
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate to the URL and focus
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  // Optional: Track notification dismissal
});

// Handle background sync (for offline support)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Helper function to sync notifications
async function syncNotifications() {
  // Get any pending reads from IndexedDB and sync them with the server
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
