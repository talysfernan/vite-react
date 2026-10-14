// Entrada do worker: serve o app e os arquivos do PWA direto do código (sem envio de assets,
// que falha pelo proxy do Claude Code) e repassa /api/ para o worker.js.
import app, { Store, Tick } from './worker.js';
import INDEX from './static/index.html';
import FAVICON from './static/favicon.svg';
import F48 from './static/favicon-48.png';
import APPLE from './static/apple-touch-icon.png';
import I192 from './static/icon-192.png';
import I512 from './static/icon-512.png';
import IMASK from './static/icon-maskable-512.png';

export { Store, Tick };
const SEC = { 'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' };
const MANIFEST = JSON.stringify({
  name: 'CAO(S) · Roteiros', short_name: 'Roteiros', start_url: '/', scope: '/', display: 'standalone',
  background_color: '#0b0b0d', theme_color: '#0b0b0d', lang: 'pt-BR',
  icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }]
});
const SW = `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});`;
const FILES = {
  '/': [INDEX, 'text/html; charset=utf-8', 'no-cache'], '/index.html': [INDEX, 'text/html; charset=utf-8', 'no-cache'],
  '/manifest.webmanifest': [MANIFEST, 'application/manifest+json', 'no-cache'], '/sw.js': [SW, 'text/javascript; charset=utf-8', 'no-cache'],
  '/favicon.svg': [FAVICON, 'image/svg+xml', 'public, max-age=86400'], '/favicon-48.png': [F48, 'image/png', 'public, max-age=86400'],
  '/apple-touch-icon.png': [APPLE, 'image/png', 'public, max-age=86400'], '/icon-192.png': [I192, 'image/png', 'public, max-age=86400'],
  '/icon-512.png': [I512, 'image/png', 'public, max-age=86400'], '/icon-maskable-512.png': [IMASK, 'image/png', 'public, max-age=86400']
};

export default {
  async fetch(req, env, ctx) {
    const p = new URL(req.url).pathname;
    if (p.startsWith('/api/')) return app.fetch(req, env, ctx);
    const f = FILES[p];
    if (!f || (req.method !== 'GET' && req.method !== 'HEAD')) return new Response('Não encontrado', { status: 404, headers: SEC });
    return new Response(req.method === 'HEAD' ? null : f[0], { headers: { ...SEC, 'content-type': f[1], 'cache-control': f[2] } });
  }
};
