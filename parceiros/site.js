// Entrada: serve o index.html embutido (o proxy quebra o upload de assets) e repassa o resto ao worker original.
import worker from './index.js';
import HTML from './index.html';
export * from './index.js';
const SEC = { 'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'no-cache' };
export default {
  ...worker,
  async fetch(req, env, ctx) {
    const u = new URL(req.url);
    if ((req.method === 'GET' || req.method === 'HEAD') && (u.pathname === '/' || u.pathname === '/index.html'))
      return new Response(req.method === 'HEAD' ? null : HTML, { headers: { 'content-type': 'text/html; charset=utf-8', ...SEC } });
    return worker.fetch(req, env, ctx);
  }
};