// WorkRadar Service Worker – Push Notifications
// Versione 1.0

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// ── Ricezione notifica push ───────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}

  const title   = data.title || 'WorkRadar';
  const options = {
    body:    data.body  || 'Hai ricevuto nuove email.',
    icon:    '/icon-192.png',
    badge:   '/icon-192.png',
    tag:     'workradar-push',          // sostituisce notifiche precedenti
    renotify: true,
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Click sulla notifica ──────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se c'è già una finestra aperta, portala in primo piano
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      // Altrimenti apri una nuova scheda
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
