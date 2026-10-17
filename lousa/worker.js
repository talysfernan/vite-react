// Lousa — canvas infinito do CAO(S). API no padrão doc-store, dados num Durable Object com SQLite.
import { DurableObject } from 'cloudflare:workers';

const enc = new TextEncoder();
const PATH_RE = /^(s|t|app)\/[A-Za-z0-9_\-]{1,60}$/;
const VIEW_RE = /^(s|t)\//;
const PANEL_KEY = 'lousa';

const json = (d, s = 200, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...h } });
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const sha = async s => b64u(await crypto.subtle.digest('SHA-256', enc.encode(s)));
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
function safeEq(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const dayBR = (t = Date.now()) => new Date(t - 3 * 36e5).toISOString().slice(0, 10);

const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS docs (path TEXT PRIMARY KEY, body TEXT NOT NULL, updated INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS docs_updated ON docs(updated)',
  'CREATE TABLE IF NOT EXISTS backup_docs (day TEXT NOT NULL, path TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY (day, path))',
  'CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS attempts (ip TEXT NOT NULL, ts INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS attempts_ip ON attempts(ip, ts)'
];

export class Store extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    for (const q of SCHEMA) ctx.storage.sql.exec(q);
    this.sql = ctx.storage.sql;
  }
  q(s, ...a) { return this.sql.exec(s, ...a).toArray(); }
  meta(k) { const r = this.q('SELECT v FROM meta WHERE k=?', k)[0]; return r ? r.v : null; }
  setMeta(k, v) { this.q('INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v', k, v); }
  pinHash(pin) { return sha(this.env.SESSION_SECRET + ':pin:' + pin); }
  async adminHash() { return this.meta('adminHash') || this.pinHash('283644'); }
  pinVer() { return this.meta('pinVer') || '1'; }
  async token(role) { const p = `${role}.${Date.now() + 12 * 36e5}.${this.pinVer()}`; return p + '.' + await hmac(this.env.SESSION_SECRET, p); }
  cookie(t) { return `caos_s=${t}; Path=/; HttpOnly; Secure; SameSite=Strict`; }
  async own(req) {
    const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)caos_s=([^;]+)/);
    if (!m) return null;
    const [role, exp, v, sig] = m[1].split('.');
    if (!sig || !safeEq(await hmac(this.env.SESSION_SECRET, `${role}.${exp}.${v}`), sig)) return null;
    if (+exp < Date.now() || v !== this.pinVer()) return null;
    return { role };
  }
  async session(req) {
    const own = await this.own(req);
    if (own) return own;
    try {
      const r = await this.env.QUINTAL.check(req.headers.get('cookie') || '', PANEL_KEY, false);
      return r && r.role ? { role: r.role, name: r.name } : null;
    } catch (e) { return null; }
  }
  allDocs(sql = "SELECT path, body FROM docs WHERE body != 'null'", ...a) {
    const docs = {};
    for (const r of this.q(sql, ...a)) docs[r.path] = JSON.parse(r.body);
    return docs;
  }
  snapshot() {
    const day = dayBR();
    this.ctx.storage.transactionSync(() => {
      this.q('DELETE FROM backup_docs WHERE day=?', day);
      this.q("INSERT INTO backup_docs(day,path,body) SELECT ?, path, body FROM docs WHERE body != 'null'", day);
      this.q('DELETE FROM backup_docs WHERE day < ?', dayBR(Date.now() - 30 * 864e5));
      this.q('DELETE FROM attempts WHERE ts < ?', Date.now() - 864e5);
    });
    return day;
  }
  // foto diária por alarme do próprio Durable Object (22:50 em São Paulo)
  async armAlarm() {
    if (await this.ctx.storage.getAlarm()) return;
    const d = new Date(); d.setUTCHours(1, 50, 0, 0);
    if (d.getTime() <= Date.now()) d.setUTCDate(d.getUTCDate() + 1);
    await this.ctx.storage.setAlarm(d.getTime());
  }
  async alarm() { this.snapshot(); await this.armAlarm(); }

  async fetch(req) {
    try { await this.armAlarm(); return await this.api(req, new URL(req.url)); }
    catch (e) { return json({ error: String((e && e.message) || e) }, 500); }
  }

  async api(req, url) {
    const p = url.pathname, method = req.method, env = this.env;
    const ip = req.headers.get('cf-connecting-ip') || 'x';
    if (p === '/api/ver') return json({ v: env.CF_VERSION_METADATA?.id || '' });
    if (p === '/api/login' && method === 'POST') {
      if ((this.q('SELECT COUNT(*) AS n FROM attempts WHERE ip=? AND ts>?', ip, Date.now() - 6e5)[0]?.n || 0) >= 40) return json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, 429);
      const { pin = '', kind = '' } = await req.json().catch(() => ({}));
      if (kind !== 'admin') return json({ error: 'sso' }, 403);
      if (!safeEq(await this.pinHash(String(pin)), await this.adminHash())) {
        this.q('INSERT INTO attempts(ip,ts) VALUES(?,?)', ip, Date.now());
        return json({ ok: false }, 403);
      }
      return json({ ok: true, role: 'admin' }, 200, { 'set-cookie': this.cookie(await this.token('admin')) });
    }
    if (p === '/api/logout' && method === 'POST') {
      const h = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' });
      h.append('set-cookie', 'caos_s=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
      h.append('set-cookie', 'caos_q=; Path=/; Domain=meucaos.com; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
      return new Response('{"ok":true}', { headers: h });
    }
    if (p === '/api/export' && method === 'GET') {
      const key = url.searchParams.get('key') || '';
      if (!env.EXPORT_KEY || !safeEq(key, env.EXPORT_KEY)) return json({ error: 'forbidden' }, 403);
      return json({ format: 'painel-caos-docs-v1', app: 'caos-lousa', exportedAt: new Date().toISOString(), docs: this.allDocs() });
    }
    if (p === '/api/session') {
      const own = await this.own(req);
      if (own) return json({ role: own.role, name: 'emergência' });
      try {
        const r = await env.QUINTAL.check(req.headers.get('cookie') || '', PANEL_KEY, true);
        return json({ role: r?.role || null, name: r?.name || null, reason: r?.reason || null, sso: true, glitch: r?.glitch !== false });
      } catch (e) { return json({ role: null, down: true }); }
    }

    const s = await this.session(req);
    if (!s) return json({ error: 'login' }, 401);
    const admin = s.role === 'admin';

    if (p === '/api/docs' && method === 'GET') return json({ docs: this.allDocs(), now: Date.now() });
    if (p === '/api/changes' && method === 'GET') {
      const since = +url.searchParams.get('since') || 0;
      return json({ docs: this.allDocs('SELECT path, body FROM docs WHERE updated > ?', since), now: Date.now() });
    }
    if (p === '/api/docs' && method === 'POST') {
      const { ops } = await req.json().catch(() => ({}));
      if (!Array.isArray(ops) || !ops.length || ops.length > 400) return json({ error: 'bad ops' }, 400);
      const rows = [];
      for (const o of ops) {
        if (!o || typeof o.path !== 'string' || !PATH_RE.test(o.path)) return json({ error: 'bad path ' + o?.path }, 400);
        if (!admin && !VIEW_RE.test(o.path)) return json({ error: 'admin' }, 403);
        const body = o.body === null || o.body === undefined ? 'null' : JSON.stringify(o.body);
        if (body.length > 15e5) return json({ error: 'too large ' + o.path }, 413);
        rows.push([o.path, body]);
      }
      // "updated" estritamente crescente: quem consulta /api/changes?since= não perde nada
      const now = Math.max(Date.now(), +(this.meta('last') || 0) + 1);
      this.ctx.storage.transactionSync(() => {
        for (const [path, body] of rows) this.q('INSERT INTO docs(path,body,updated) VALUES(?,?,?) ON CONFLICT(path) DO UPDATE SET body=excluded.body, updated=excluded.updated', path, body, now);
        this.setMeta('last', String(now));
      });
      return json({ ok: true, now });
    }

    if (!admin) return json({ error: 'admin' }, 403);
    if (p === '/api/pin' && method === 'POST') {
      const { pin } = await req.json().catch(() => ({}));
      if (String(pin || '').length < 4) return json({ error: 'bad pin' }, 400);
      this.setMeta('adminHash', await this.pinHash(String(pin)));
      this.setMeta('pinVer', String(+this.pinVer() + 1));
      return json({ ok: true }, 200, { 'set-cookie': this.cookie(await this.token('admin')) });
    }
    if (p === '/api/backups' && method === 'GET') return json({ backups: this.q('SELECT day, COUNT(*) AS n FROM backup_docs GROUP BY day ORDER BY day DESC') });
    if (p === '/api/backups/now' && method === 'POST') return json({ day: this.snapshot() });
    const bm = p.match(/^\/api\/backups\/(\d{4}-\d{2}-\d{2})$/);
    if (bm && method === 'GET') return json({ format: 'painel-caos-docs-v1', app: 'caos-lousa', exportedAt: bm[1], docs: this.allDocs('SELECT path, body FROM backup_docs WHERE day=?', bm[1]) });
    return json({ error: 'not found' }, 404);
  }
}

export const api = (req, env) => env.STORE.get(env.STORE.idFromName('main')).fetch(req);
