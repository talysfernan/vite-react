// Entrada: serve o index.html embutido (o proxy quebra o upload de assets) e repassa o resto ao worker original.
// /api/ajustes = tarifas e logística dos Ajustes Globais (service binding AJUSTES), só para quem tem sessão.
import worker from './worker.js';
import INDEX from './index.html';
const HEAD = { 'content-type': 'text/html; charset=utf-8', 'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'no-cache' };
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
export default {
  async fetch(req, env, ctx) {
    const u = new URL(req.url), p = u.pathname;
    if ((p === '/' || p === '/index.html') && (req.method === 'GET' || req.method === 'HEAD')) return new Response(req.method === 'HEAD' ? null : INDEX, { headers: HEAD });
    if (p === '/api/ajustes' && req.method === 'GET') {
      const ses = await worker.fetch(new Request(u.origin + '/api/session', { headers: req.headers }), env, ctx).then(r => r.json()).catch(() => ({}));
      if (!ses.role) return J({ error: 'login' }, 401);
      if (!env.AJUSTES) return J({ error: 'sem ajustes' }, 503);
      const all = await env.AJUSTES.all(), tar = {};
      for (const [k, v] of Object.entries(all)) { const m = k.match(/^tar\/(.+)__BR$/); if (m) tar[m[1]] = v; }
      return J({ country: 'BR', brands: all['app/brands'] || [], tar });
    }
    return worker.fetch(req, env, ctx);
  },
  scheduled: (ev, env, ctx) => worker.scheduled(ev, env, ctx)
};
