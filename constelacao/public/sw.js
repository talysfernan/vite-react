/* CAO(S) Rotina — service worker: recebe notificações push */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'CAO(S) Rotina', {
    body: d.body || 'Você tem um aviso na Rotina.', icon: '/icon-192.png', badge: '/favicon-48.png', tag: d.tag || undefined, renotify: !!d.tag, data: { url: d.url || '/' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { for (const c of cs) if (c.url.startsWith(self.location.origin)) { c.focus(); c.navigate(url).catch(() => {}); return; } return self.clients.openWindow(url); }));
});
self.addEventListener('fetch', () => {});
