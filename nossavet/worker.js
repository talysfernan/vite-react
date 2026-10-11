// nossavet — painel da semana de conteúdos (BR e US no mesmo endereço, dados separados por país)
// Tudo vai no código (HTML, ícones, manifest, sw): o envio de assets pelo proxy do Claude Code falha.
import { WorkerEntrypoint, DurableObject } from 'cloudflare:workers';
import INDEX from './public/index.html';
import FAVICON from './public/favicon.svg';
import FAV48 from './public/favicon-48.png';
import ICON192 from './public/icon-192.png';
import ICON512 from './public/icon-512.png';
import ICONMASK from './public/icon-maskable-512.png';
import APPLE from './public/apple-touch-icon.png';

const enc = new TextEncoder();
const PATH_RE = /^(app|item|prod)\/[A-Za-z0-9_\-.~:@+]{1,200}$/;
const VIEW_RE = /^item\//;
const MAX_FILE = 20 * 1024 * 1024;
const STAGES = ['tema', 'roteiro', 'aprovacao', 'aprovado', 'producao', 'publicado', 'feito'];
const BOARDS = ['br', 'us'];
const PAIS = { br: 'Brasil', us: 'USA' };

const json = (d, s = 200, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...h } });
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const sha = async s => b64u(await crypto.subtle.digest('SHA-256', enc.encode(s)));
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
function safeEq(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
async function getMeta(env, k) { const r = await env.DB.prepare('SELECT v FROM meta WHERE k=?').bind(k).first(); return r ? r.v : null; }
async function setMeta(env, k, v) { await env.DB.prepare('INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(k, v).run(); }
const pinHash = (env, pin) => sha(env.SESSION_SECRET + ':pin:' + pin);
const storedHash = async env => (await getMeta(env, 'adminHash')) || pinHash(env, '283644');
const pinVer = async env => (await getMeta(env, 'pinVer')) || '1';
async function makeToken(env, role) {
  const p = `${role}.${Date.now() + 12 * 36e5}.${await pinVer(env)}`;
  return p + '.' + (await hmac(env.SESSION_SECRET, p));
}
const setCookie = t => `nv_s=${t}; Path=/; HttpOnly; Secure; SameSite=Strict`;
async function ownSession(req, env) {
  const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)nv_s=([^;]+)/);
  if (!m) return null;
  const [role, exp, v, sig] = m[1].split('.');
  if (!sig) return null;
  if (!safeEq(await hmac(env.SESSION_SECRET, `${role}.${exp}.${v}`), sig)) return null;
  if (+exp < Date.now() || v !== (await pinVer(env))) return null;
  return { role, name: 'emergência' };
}
async function session(req, env) {
  const own = await ownSession(req, env);
  if (own) return own;
  try {
    const r = await env.QUINTAL.check(req.headers.get('cookie') || '', env.PANEL_KEY, false);
    return r && r.role ? { role: r.role, name: r.name === 'admin' ? 'Mestre' : r.name } : null;
  } catch (e) { return null; }
}
async function tooMany(env, ip) {
  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM attempts WHERE ip=? AND ts>?').bind(ip, Date.now() - 10 * 6e4).first();
  return (r?.n || 0) >= 40;
}
const dayBR = (t = Date.now()) => new Date(t - 3 * 36e5).toISOString().slice(0, 10);
async function allDocs(env) {
  const { results } = await env.DB.prepare("SELECT path, body FROM docs WHERE body != 'null'").all();
  const docs = {};
  for (const r of results) docs[r.path] = JSON.parse(r.body);
  return docs;
}
async function getDoc(env, path) {
  const r = await env.DB.prepare('SELECT body FROM docs WHERE path=?').bind(path).first();
  return r && r.body !== 'null' ? JSON.parse(r.body) : null;
}
const putDoc = (env, path, body) => env.DB.prepare('INSERT INTO docs(path,body,updated) VALUES(?,?,?) ON CONFLICT(path) DO UPDATE SET body=excluded.body, updated=excluded.updated').bind(path, body === null ? 'null' : JSON.stringify(body), Date.now()).run();
async function snapshot(env) {
  const day = dayBR();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM backup_docs WHERE day=?').bind(day),
    env.DB.prepare("INSERT INTO backup_docs(day,path,body) SELECT ?, path, body FROM docs WHERE body != 'null'").bind(day),
    env.DB.prepare('DELETE FROM backup_docs WHERE day < ?').bind(dayBR(Date.now() - 30 * 864e5)),
    env.DB.prepare('DELETE FROM attempts WHERE ts < ?').bind(Date.now() - 864e5)
  ]);
  return day;
}
const si = s => Math.max(0, STAGES.indexOf(s || 'tema'));
const sameJ = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/* quem não é admin não aprova: não mexe na aprovação nem passa da etapa "aprovação" sem ela */
function viewGuard(old, nu) {
  if (nu === null) return !old || si(old.stage) === 0;
  const o = old || {};
  if (!sameJ(o.apr, nu.apr)) return false;
  if (si(nu.stage) >= si('aprovado') && !nu.apr) return false;
  const orq = o.rq || null, nrq = nu.rq || null;
  if (nrq && nrq.status !== 'pending' && !sameJ(orq, nrq)) return false;
  return true;
}

/* aprovar/pedir ajuste (usado pelo painel e pela caixa de Pedidos da Rotina) */
function decideItem(it, accept, note, by, via) {
  if (!it.rq || it.rq.status !== 'pending') return false;
  const t = Date.now();
  it.rq = { ...it.rq, status: accept ? 'ok' : 'no', decidedAt: t, note, dby: by };
  it.hist = [...(it.hist || []), { t, by, a: accept ? 'aprovou' : 'ajuste', note, via }].slice(-80);
  if (accept) { it.stage = 'aprovado'; it.apr = { by, t }; it.aj = false; }
  else { it.stage = 'roteiro'; it.apr = null; it.aj = true; }
  it.u = t;
  return true;
}

async function api(req, env, url) {
  const p = url.pathname, method = req.method;
  const ip = req.headers.get('cf-connecting-ip') || 'x';
  if (p === '/api/ping') return json({ ok: true });
  if (p === '/api/ver') return json({ v: env.CF_VERSION_METADATA?.id || '' });
  if (p === '/api/login' && method === 'POST') {
    if (await tooMany(env, ip)) return json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, 429);
    const { pin = '', kind = '' } = await req.json().catch(() => ({}));
    if (kind !== 'admin') return json({ error: 'sso' }, 403);
    if (!safeEq(await pinHash(env, String(pin)), await storedHash(env))) {
      await env.DB.prepare('INSERT INTO attempts(ip,ts) VALUES(?,?)').bind(ip, Date.now()).run();
      return json({ ok: false }, 403);
    }
    return json({ ok: true, role: 'admin' }, 200, { 'set-cookie': setCookie(await makeToken(env, 'admin')) });
  }
  if (p === '/api/logout' && method === 'POST') {
    const h = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' });
    h.append('set-cookie', 'nv_s=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    h.append('set-cookie', 'caos_q=; Path=/; Domain=meucaos.com; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    return new Response('{"ok":true}', { headers: h });
  }
  if (p === '/api/export' && method === 'GET') {
    if (!env.EXPORT_KEY || !safeEq(url.searchParams.get('key') || '', env.EXPORT_KEY)) return json({ error: 'forbidden' }, 403);
    return json({ format: 'painel-caos-docs-v1', app: 'caos-nossavet', board: env.BOARD, exportedAt: new Date().toISOString(), docs: await allDocs(env) });
  }
  if (p === '/api/session') {
    const own = await ownSession(req, env);
    if (own) return json({ role: own.role, name: own.name, board: env.BOARD });
    try {
      const r = await env.QUINTAL.check(req.headers.get('cookie') || '', env.PANEL_KEY, true);
      return json({ role: r?.role || null, name: r?.name === 'admin' ? 'Mestre' : r?.name || null, reason: r?.reason || null, sso: true, glitch: r?.glitch !== false, board: env.BOARD });
    } catch (e) { return json({ role: null, down: true }); }
  }
  const s = await session(req, env);
  if (!s) return json({ error: 'login' }, 401);
  const admin = s.role === 'admin';

  if (p === '/api/files' && method === 'POST') {
    const buf = await req.arrayBuffer();
    if (!buf.byteLength) return json({ error: 'vazio' }, 400);
    if (buf.byteLength > MAX_FILE) return json({ error: 'Arquivo maior que 20 MB' }, 413);
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20), PART = 18e5;
    const name = decodeURIComponent(req.headers.get('x-name') || 'arquivo').slice(0, 200), type = (req.headers.get('content-type') || 'application/octet-stream').slice(0, 120);
    const stmts = [env.DB.prepare('INSERT INTO files(id,name,type,size,t) VALUES(?,?,?,?,?)').bind(id, name, type, buf.byteLength, Date.now())];
    for (let i = 0, n = 0; i < buf.byteLength; i += PART, n++) stmts.push(env.DB.prepare('INSERT INTO file_parts(id,n,data) VALUES(?,?,?)').bind(id, n, buf.slice(i, i + PART)));
    await env.DB.batch(stmts);
    return json({ id, name, type, size: buf.byteLength });
  }
  const fm = p.match(/^\/api\/(?:blob|files)\/([a-f0-9]{20})$/);
  if (fm && method === 'GET') {
    const f = await env.DB.prepare('SELECT name,type,size FROM files WHERE id=?').bind(fm[1]).first();
    if (!f) return json({ error: 'not found' }, 404);
    const { results } = await env.DB.prepare('SELECT data FROM file_parts WHERE id=? ORDER BY n').bind(fm[1]).all();
    const body = new Uint8Array(f.size); let o = 0;
    for (const r of results) { const d = new Uint8Array(r.data); body.set(d, o); o += d.byteLength; }
    const disp = (url.searchParams.has('dl') ? 'attachment' : 'inline') + "; filename*=UTF-8''" + encodeURIComponent(f.name);
    return new Response(body, { headers: { 'content-type': f.type, 'content-length': String(f.size), 'content-disposition': disp, 'cache-control': 'private, max-age=31536000, immutable', 'x-content-type-options': 'nosniff', 'content-security-policy': 'sandbox' } });
  }
  if (fm && method === 'DELETE') {
    await env.DB.batch([env.DB.prepare('DELETE FROM file_parts WHERE id=?').bind(fm[1]), env.DB.prepare('DELETE FROM files WHERE id=?').bind(fm[1])]);
    return json({ ok: true });
  }
  if (p === '/api/docs' && method === 'GET') return json({ docs: await allDocs(env), now: Date.now() });
  if (p === '/api/changes' && method === 'GET') {
    const since = +url.searchParams.get('since') || 0;
    const { results } = await env.DB.prepare('SELECT path, body FROM docs WHERE updated > ?').bind(since).all();
    const docs = {};
    for (const r of results) docs[r.path] = JSON.parse(r.body);
    return json({ docs, now: Date.now() });
  }
  if (p === '/api/docs' && method === 'POST') {
    const { ops } = await req.json().catch(() => ({}));
    if (!Array.isArray(ops) || !ops.length || ops.length > 400) return json({ error: 'bad ops' }, 400);
    const now = Date.now(), stmts = [];
    for (const o of ops) {
      if (!o || typeof o.path !== 'string' || !PATH_RE.test(o.path)) return json({ error: 'bad path ' + o?.path }, 400);
      if (!admin) {
        if (!VIEW_RE.test(o.path)) return json({ error: 'admin' }, 403);
        if (!viewGuard(await getDoc(env, o.path), o.body ?? null)) return json({ error: 'admin' }, 403);
      }
      const body = o.body == null ? 'null' : JSON.stringify(o.body);
      if (body.length > 15e5) return json({ error: 'too large ' + o.path }, 413);
      stmts.push(env.DB.prepare('INSERT INTO docs(path,body,updated) VALUES(?,?,?) ON CONFLICT(path) DO UPDATE SET body=excluded.body, updated=excluded.updated').bind(o.path, body, now));
    }
    await env.DB.batch(stmts);
    return json({ ok: true, now });
  }
  if (!admin) return json({ error: 'admin' }, 403);
  if (p === '/api/pin' && method === 'POST') {
    const { pin } = await req.json().catch(() => ({}));
    if (String(pin || '').length < 4) return json({ error: 'bad pin' }, 400);
    await setMeta(env, 'adminHash', await pinHash(env, String(pin)));
    await setMeta(env, 'pinVer', String(+(await pinVer(env)) + 1));
    return json({ ok: true }, 200, { 'set-cookie': setCookie(await makeToken(env, 'admin')) });
  }
  if (p === '/api/backups' && method === 'GET') {
    const { results } = await env.DB.prepare('SELECT day, COUNT(*) AS n FROM backup_docs GROUP BY day ORDER BY day DESC').all();
    return json({ backups: results });
  }
  if (p === '/api/backups/now' && method === 'POST') return json({ day: await snapshot(env) });
  const bm = p.match(/^\/api\/backups\/(\d{4}-\d{2}-\d{2})$/);
  if (bm && method === 'GET') {
    const { results } = await env.DB.prepare('SELECT path, body FROM backup_docs WHERE day=?').bind(bm[1]).all();
    const docs = {};
    for (const r of results) docs[r.path] = JSON.parse(r.body);
    return json({ format: 'painel-caos-docs-v1', app: 'caos-nossavet', board: env.BOARD, exportedAt: bm[1], docs });
  }
  return json({ error: 'not found' }, 404);
}

const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS docs (path TEXT PRIMARY KEY, body TEXT NOT NULL, updated INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS backup_docs (day TEXT NOT NULL, path TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY (day, path))',
  'CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS attempts (ip TEXT NOT NULL, ts INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS attempts_ip ON attempts(ip, ts)',
  'CREATE INDEX IF NOT EXISTS docs_updated ON docs(updated)',
  'CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, size INTEGER NOT NULL, t INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS file_parts (id TEXT NOT NULL, n INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY (id, n))'
];
/* adaptador: o SQLite do Durable Object com a mesma cara do D1 */
function d1(storage) {
  const conv = v => (v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v);
  const stmt = (q, args = []) => ({
    bind: (...a) => stmt(q, a.map(conv)),
    _x: () => storage.sql.exec(q, ...args).toArray(),
    async all() { return { results: this._x(), success: true }; },
    async first() { return this._x()[0] || null; },
    async run() { this._x(); return { success: true }; }
  });
  return { prepare: q => stmt(q), batch: async list => { storage.transactionSync(() => list.forEach(s => s._x())); return list.map(() => ({ success: true })); } };
}

export class Store extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    for (const q of SCHEMA) ctx.storage.sql.exec(q);
    this.e = { ...env, DB: d1(ctx.storage) };
  }
  envFor(b) { return { ...this.e, BOARD: b, PANEL_KEY: 'nossavet-' + b }; }
  async fetch(req) {
    const url = new URL(req.url), b = req.headers.get('x-board') === 'us' ? 'us' : 'br';
    try { return await api(req, this.envFor(b), url); }
    catch (e) { return json({ error: String((e && e.message) || e) }, 500); }
  }
  async tick(t) {
    const d = new Date(t || Date.now());
    if (d.getUTCHours() === 1 && d.getUTCMinutes() >= 50 && d.getUTCMinutes() < 55) await snapshot(this.e);
    return true;
  }
  /* caixa de Pedidos da Rotina: conteúdos esperando aprovação (e os decididos na última semana) */
  async inbox(b) {
    const env = this.e, week = Date.now() - 7 * 864e5;
    const { results } = await env.DB.prepare(`SELECT path, body FROM docs WHERE path LIKE 'item/%' AND body LIKE '%"rq"%'`).all();
    const prods = {};
    for (const r of (await env.DB.prepare("SELECT path, body FROM docs WHERE path LIKE 'prod/%'").all()).results) if (r.body !== 'null') prods[r.path.slice(5)] = JSON.parse(r.body).name;
    const items = [];
    for (const r of results) {
      if (r.body === 'null') continue;
      const it = JSON.parse(r.body), q = it.rq;
      if (!q || (q.status !== 'pending' && !(q.decidedAt > week))) continue;
      const id = r.path.slice(5), pn = (it.prods || []).map(x => prods[x.id]).filter(Boolean).join(', ');
      items.push({ id: b + ':' + id, rid: q.id, title: it.title || 'Conteúdo sem tema', brand: pn, stage: q.status === 'pending' ? 'Em aprovação' : q.status === 'ok' ? 'Aprovado' : 'Ajuste pedido', type: 'aprovar', label: 'Aprovar conteúdo · ' + PAIS[b], reason: it.date ? 'publica ' + it.date.split('-').reverse().slice(0, 2).join('/') : '', by: q.by || '', ts: q.t, status: q.status === 'pending' ? 'pending' : q.status === 'ok' ? 'accepted' : 'rejected', decidedAt: q.decidedAt || null, note: q.note || '', link: 'https://nossavet.meucaos.com/?pais=' + b + '&c=' + id });
    }
    return items;
  }
  async decide(id, rid, accept, note, by) {
    const path = 'item/' + id, it = await getDoc(this.e, path);
    if (!it) return { ok: false, error: 'não encontrado' };
    if (!it.rq || it.rq.id !== rid) return { ok: false, error: 'pedido não encontrado' };
    if (!decideItem(it, !!accept, String(note || '').slice(0, 400), String(by || 'Mestre').slice(0, 60), 'Pedidos')) return { ok: false, error: 'já decidido' };
    await putDoc(this.e, path, it);
    return { ok: true };
  }
}

const boardOf = (url, req) => {
  const h = req.headers.get('x-board') || url.searchParams.get('b'), c = ((req.headers.get('cookie') || '').match(/(?:^|;\s*)nv_b=(br|us)/) || [])[1];
  return h === 'us' || h === 'br' ? h : c || 'br';
};
const store = (env, b) => env.STORE.get(env.STORE.idFromName(b));
const SEC = { 'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' };
const MANIFEST = JSON.stringify({
  name: 'nossavet · CAO(S)', short_name: 'nossavet', start_url: '/', scope: '/', display: 'standalone', background_color: '#0b0b0d', theme_color: '#0b0b0d', lang: 'pt-BR',
  icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }]
});
const SW = `self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',()=>{});`;
const STATIC = {
  '/favicon.svg': [FAVICON, 'image/svg+xml'], '/favicon-48.png': [FAV48, 'image/png'], '/icon-192.png': [ICON192, 'image/png'], '/icon-512.png': [ICON512, 'image/png'],
  '/icon-maskable-512.png': [ICONMASK, 'image/png'], '/apple-touch-icon.png': [APPLE, 'image/png'], '/manifest.webmanifest': [MANIFEST, 'application/manifest+json'], '/sw.js': [SW, 'text/javascript']
};

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname;
    if (p.startsWith('/api/')) {
      const b = boardOf(url, req), r2 = new Request(req);
      r2.headers.set('x-board', b);
      return store(env, b).fetch(r2);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('método', { status: 405 });
    const st = STATIC[p];
    if (st) return new Response(req.method === 'HEAD' ? null : st[0], { headers: { 'content-type': st[1], 'cache-control': p === '/sw.js' || p === '/manifest.webmanifest' ? 'no-cache' : 'public, max-age=86400', ...SEC } });
    if (p === '/' || p === '/index.html') return new Response(req.method === 'HEAD' ? null : INDEX, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', ...SEC, 'x-frame-options': 'DENY' } });
    return Response.redirect(url.origin + '/', 302);
  }
};

/* chamado pelo cron de 5 min da Rotina principal (foto diária) */
export class Tick extends WorkerEntrypoint {
  async run(t) { for (const b of BOARDS) await store(this.env, b).tick(t); return true; }
}

/* caixa de Pedidos da Rotina do Talys */
export class Inbox extends WorkerEntrypoint {
  async list() {
    const items = [];
    for (const b of BOARDS) items.push(...(await store(this.env, b).inbox(b)));
    return { key: 'nossavet', name: 'nossavet', url: 'https://nossavet.meucaos.com', items };
  }
  async decide(id, rid, accept, note, by) {
    const m = String(id).match(/^(br|us):([A-Za-z0-9_\-.~:@+]{1,200})$/);
    if (!m) return { ok: false, error: 'id' };
    return store(this.env, m[1]).decide(m[2], String(rid), !!accept, note, by);
  }
}
