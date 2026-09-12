// Firebase Messaging Service Worker for Nova Eye Care
// Handles background push notifications on Android, iOS Safari PWA, and desktop browsers

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Nova Eye Care Firebase web app configuration
const firebaseConfig = {
  apiKey: "AIzaSyByzZYAmgdVImGaUNvvSp8tPde-jxCczIc",
  authDomain: "nova-eye-care.firebaseapp.com",
  projectId: "nova-eye-care",
  storageBucket: "nova-eye-care.firebasestorage.app",
  messagingSenderId: "260223243081",
  appId: "1:260223243081:web:062646e48756d457548098"
};

firebase.initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.warn('[SW] Messaging init warning:', e);
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background notification received:', payload);

    const title = payload.notification?.title || payload.data?.title || 'Nova Eye Care Alert';
    const body = payload.notification?.body || payload.data?.body || 'You have a new update from Nova Eye Care.';
    const icon = payload.notification?.icon || '/icons/icon-192.png';
    const tag = payload.data?.tag || 'nova-eye-care-notification';
    const clickUrl = payload.data?.url || payload.fcmOptions?.link || '/dashboard';

    const notificationOptions = {
      body,
      icon,
      badge: '/icons/icon-192.png',
      tag,
      vibrate: [200, 100, 200],
      data: {
        url: clickUrl,
        ...payload.data
      },
      actions: [
        { action: 'open', title: 'View Update' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    self.registration.showNotification(title, notificationOptions);
  });
}

// Handle notification tap / click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
