self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function(event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) {}
  // Tag univoco per email: evita che le notifiche si sovrascrivano
  var tag = 'wr-' + (data.tag || Date.now());
  event.waitUntil(
    self.registration.showNotification(data.title || 'WorkRadar', {
      body:      data.body  || 'Hai ricevuto una nuova email.',
      icon:      '/icon-192.png',
      badge:     '/icon-192.png',
      tag:       tag,
      renotify:  false,
      data:      { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if ('focus' in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
