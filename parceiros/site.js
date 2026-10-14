// Entrada: serve o index.html embutido (o proxy quebra o upload de assets) e repassa o resto ao worker original.
// Um painel por país (BR/US): cada país tem o seu banco D1 (DB / DB_US) e a sua chave no Quintal (parceiros-br / parceiros-us).
// O país vem do cabeçalho x-board (app), depois de ?b= (imagens) ou ?pais=, depois do cookie prt_b.
import worker from './index.js';
import HTML from './index.html';
export * from './index.js';
const SEC = { 'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'no-cache' };
const boardOf = (req, u) => {
  const h = req.headers.get('x-board') || u.searchParams.get('b') || u.searchParams.get('pais');
  if (h === 'us' || h === 'br') return h;
  return ((req.headers.get('cookie') || '').match(/(?:^|;\s*)prt_b=(br|us)/) || [])[1] || 'br';
};
const envFor = (env, b) => ({ ...env, DB: b === 'us' && env.DB_US ? env.DB_US : env.DB, PANEL_KEY: 'parceiros-' + b, BOARD: b });
/* primeiro acesso aos EUA: copia título/logo e operadores do Brasil (marcas, produtos e parceiros começam vazios) */
let seeded = false;
async function seedUS(env) {
  if (seeded || !env.DB_US) return; seeded = true;
  if (await env.DB_US.prepare('SELECT 1 FROM docs LIMIT 1').first()) return;
  const { results } = await env.DB.prepare("SELECT path, body FROM docs WHERE (path = 'cfg/app' OR path LIKE 'operators/%') AND body != 'null'").all();
  const now = Date.now();
  if (results.length) await env.DB_US.batch(results.map(r => env.DB_US.prepare('INSERT OR IGNORE INTO docs(path,body,updated) VALUES(?,?,?)').bind(r.path, r.body, now)));
}
export default {
  ...worker,
  async fetch(req, env, ctx) {
    const u = new URL(req.url);
    if ((req.method === 'GET' || req.method === 'HEAD') && (u.pathname === '/' || u.pathname === '/index.html'))
      return new Response(req.method === 'HEAD' ? null : HTML, { headers: { 'content-type': 'text/html; charset=utf-8', ...SEC } });
    const b = boardOf(req, u);
    /* tarifas e logística dos Ajustes Globais (só leitura) — só para quem tem sessão neste painel */
    if (u.pathname === '/api/ajustes' && req.method === 'GET') {
      const ses = await worker.fetch(new Request(u.origin + '/api/session', { headers: req.headers }), envFor(env, b), ctx).then(r => r.json()).catch(() => ({}));
      if (!ses.role) return new Response('{"error":"login"}', { status: 401, headers: { 'content-type': 'application/json' } });
      if (!env.AJUSTES) return new Response('{"error":"sem ajustes"}', { status: 503, headers: { 'content-type': 'application/json' } });
      const all = await env.AJUSTES.all(), c = b === 'us' ? 'US' : 'BR', tar = {};
      for (const [k, v] of Object.entries(all)) { const m = k.match(/^tar\/(.+)__(BR|US)$/); if (m && m[2] === c) tar[m[1]] = v; }
      return new Response(JSON.stringify({ country: c, brands: all['app/brands'] || [], tar }), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
    }
    if (b === 'us') await seedUS(env).catch(() => (seeded = false));
    return worker.fetch(req, envFor(env, b), ctx);
  },
  async scheduled(ev, env, ctx) {
    await worker.scheduled(ev, envFor(env, 'br'), ctx);
    if (env.DB_US) await worker.scheduled(ev, envFor(env, 'us'), ctx);
  }
};
