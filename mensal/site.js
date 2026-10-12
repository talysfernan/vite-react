// Entrada do worker: serve o index.html embutido no código e repassa o resto para o worker.js.
// (O envio de assets pelo proxy do Claude Code falha; assim o HTML vai junto com o código.)
import app, { Sums } from './worker.js';
import INDEX from './public/index.html';

export { Sums };
const HEAD = { 'content-type': 'text/html; charset=utf-8', 'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'no-cache' };

export default {
  async fetch(req, env, ctx) {
    const p = new URL(req.url).pathname;
    if ((p === '/' || p === '/index.html') && (req.method === 'GET' || req.method === 'HEAD')) return new Response(req.method === 'HEAD' ? null : INDEX, { headers: HEAD });
    return app.fetch(req, env, ctx);
  },
  scheduled: (ev, env, ctx) => app.scheduled(ev, env, ctx)
};
