// Entrada do worker: tudo vai embutido no código (o proxy do Claude Code quebra o envio de assets).
import { Store, api } from './worker.js';
import INDEX from './public/index.html';
import FAVICON from './public/favicon.svg';
import ICON192 from './public/icon-192.png';
import ICON512 from './public/icon-512.png';
import MASK512 from './public/icon-maskable-512.png';
import FAV48 from './public/favicon-48.png';
import APPLE from './public/apple-touch-icon.png';

export { Store };
const SEC = { 'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' };
const MANIFEST = JSON.stringify({
  name: 'CAO(S) · Lousa', short_name: 'Lousa', start_url: '/', scope: '/', display: 'standalone',
  background_color: '#0b0b0d', theme_color: '#0b0b0d', lang: 'pt-BR',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
});
const SW = "self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',()=>{});";
const FILES = {
  '/': [INDEX, 'text/html; charset=utf-8', 'no-cache'],
  '/index.html': [INDEX, 'text/html; charset=utf-8', 'no-cache'],
  '/manifest.webmanifest': [MANIFEST, 'application/manifest+json', 'no-cache'],
  '/sw.js': [SW, 'text/javascript; charset=utf-8', 'no-cache'],
  '/favicon.svg': [FAVICON, 'image/svg+xml', 'public, max-age=86400'],
  '/favicon.ico': [FAV48, 'image/png', 'public, max-age=86400'],
  '/favicon-48.png': [FAV48, 'image/png', 'public, max-age=86400'],
  '/icon-192.png': [ICON192, 'image/png', 'public, max-age=86400'],
  '/icon-512.png': [ICON512, 'image/png', 'public, max-age=86400'],
  '/icon-maskable-512.png': [MASK512, 'image/png', 'public, max-age=86400'],
  '/apple-touch-icon.png': [APPLE, 'image/png', 'public, max-age=86400']
};

export default {
  async fetch(req, env) {
    const p = new URL(req.url).pathname;
    if (p.startsWith('/api/')) return api(req, env);
    const f = FILES[p];
    if (!f || (req.method !== 'GET' && req.method !== 'HEAD')) return new Response('Não encontrado', { status: 404, headers: SEC });
    return new Response(req.method === 'HEAD' ? null : f[0], { headers: { ...SEC, 'content-type': f[1], 'cache-control': f[2] } });
  }
};
