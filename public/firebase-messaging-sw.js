/**
 * Firebase Messaging Service Worker
 * 
 * This service worker handles background push notifications from Firebase Cloud Messaging (FCM)
 * It must be at the root of your domain (public folder)
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyBmUpXfgTCRTigSo-s2fJLE-FbB1Vzr7cw",
  authDomain: "fast-track-c1270.firebaseapp.com",
  projectId: "fast-track-c1270",
  storageBucket: "fast-track-c1270.firebasestorage.app",
  messagingSenderId: "144676690370",
  appId: "1:144676690370:web:d3de7214fb45876a089e5b",
  measurementId: "G-F3N17FZMMW"
});

// Get Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'إشعار جديد';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: payload.data?.tag || 'default',
    data: payload.data || {},
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'فتح',
      },
      {
        action: 'close',
        title: 'إغلاق',
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  // Handle actions
  if (action === 'close') {
    return;
  }

  // Determine URL to open
  let urlToOpen = '/home';
  
  if (data.url) {
    urlToOpen = data.url;
  } else if (data.orderId || data.order_id) {
    urlToOpen = `/orders/${data.orderId || data.order_id}`;
  }

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
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

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  // Optional: Track notification dismissal
});
