/* CAO(S) Plano Omnichannel — service worker (deixa o painel instalável) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
