// Entrada do worker: serve a página e os arquivos do PWA embutidos no código
// (o envio de assets pelo proxy do Claude Code falha) e repassa o resto para o worker.js.
import app, { Store, Tick } from './worker.js';
import INDEX from './public/index.html';
import MANIFEST from './public/manifest.webmanifest';
import SW from './public/sw.js';
import FAV from './public/favicon.svg';
import F48 from './public/favicon-48.png';
import APPLE from './public/apple-touch-icon.png';
import I192 from './public/icon-192.png';
import I512 from './public/icon-512.png';
import IMASK from './public/icon-maskable-512.png';

export { Store, Tick };
const SEC = { 'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' };
const STATIC = {
  '/': [INDEX, 'text/html; charset=utf-8', 'no-cache'],
  '/index.html': [INDEX, 'text/html; charset=utf-8', 'no-cache'],
  '/manifest.webmanifest': [MANIFEST, 'application/manifest+json', 'no-cache'],
  '/sw.js': [SW, 'text/javascript; charset=utf-8', 'no-cache'],
  '/favicon.svg': [FAV, 'image/svg+xml', 'public, max-age=86400'],
  '/favicon-48.png': [F48, 'image/png', 'public, max-age=86400'],
  '/apple-touch-icon.png': [APPLE, 'image/png', 'public, max-age=86400'],
  '/icon-192.png': [I192, 'image/png', 'public, max-age=86400'],
  '/icon-512.png': [I512, 'image/png', 'public, max-age=86400'],
  '/icon-maskable-512.png': [IMASK, 'image/png', 'public, max-age=86400']
};

export default {
  async fetch(req, env, ctx) {
    const p = new URL(req.url).pathname, f = STATIC[p];
    if (f && (req.method === 'GET' || req.method === 'HEAD')) return new Response(req.method === 'HEAD' ? null : f[0], { headers: { ...SEC, 'content-type': f[1], 'cache-control': f[2] } });
    return app.fetch(req, env, ctx);
  }
};
