// Constelação de ações — backend (Cloudflare Worker + Durable Object SQLite)
// Um único Worker atende os dois painéis (um por país). O país vem do hostname:
//   constelacao-br.meucaos.com → board "br"   ·   constelacao-us.meucaos.com → board "us"
// Login único pelo Quintal do CAO(S) (service binding QUINTAL), com senha de emergência própria.
import { WorkerEntrypoint, DurableObject } from "cloudflare:workers";
import HTML from "./index.html";

const enc = new TextEncoder();
const BOARDS = ["br", "us"];
// app/reg.*  = cadastros compartilhados entre os países (pessoas, times, marcas, canais, lojas)
// app/board.<b> = ajustes do painel de cada país · node/<b>.<id> e edge/<b>.<id> = a teia
const PATH_RE = /^(app|node|edge)\/[A-Za-z0-9_\-.~:@+]{1,200}$/;
const json = (d, s = 200, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...h } });
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const sha = async (s) => b64u(await crypto.subtle.digest("SHA-256", enc.encode(s)));
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}
function safeEq(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const boardOf = (url) => {
  const m = url.hostname.match(/^constelacao-([a-z]{2})\./);
  const b = m ? m[1] : (url.searchParams.get("b") || "br");
  return BOARDS.includes(b) ? b : "br";
};
// o que cada painel enxerga: cadastros compartilhados + ajustes e teia do próprio país
const visible = (path, b) => path.startsWith("app/reg.") || path === "app/board." + b || path.startsWith(`node/${b}.`) || path.startsWith(`edge/${b}.`);

async function getMeta(env, k) {
  const r = await env.DB.prepare("SELECT v FROM meta WHERE k=?").bind(k).first();
  return r ? r.v : null;
}
async function setMeta(env, k, v) {
  await env.DB.prepare("INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(k, v).run();
}
const pinHash = (env, pin) => sha(env.SESSION_SECRET + ":pin:" + pin);
const storedHash = async (env) => (await getMeta(env, "adminHash")) || pinHash(env, "283644");
const pinVer = async (env) => (await getMeta(env, "pinVer")) || "1";
async function makeToken(env, role) {
  const p = `${role}.${Date.now() + 12 * 36e5}.${await pinVer(env)}`;
  return p + "." + (await hmac(env.SESSION_SECRET, p));
}
const setCookie = (t) => `caos_c=${t}; Path=/; HttpOnly; Secure; SameSite=Strict`;
async function ownSession(req, env) {
  const m = (req.headers.get("cookie") || "").match(/(?:^|;\s*)caos_c=([^;]+)/);
  if (!m) return null;
  const [role, exp, v, sig] = m[1].split(".");
  if (!sig) return null;
  if (!safeEq(await hmac(env.SESSION_SECRET, `${role}.${exp}.${v}`), sig)) return null;
  if (+exp < Date.now() || v !== (await pinVer(env))) return null;
  return { role, name: "emergência" };
}
async function session(req, env, host, doLog) {
  const own = await ownSession(req, env);
  if (own) return own;
  try {
    const r = await env.QUINTAL.check(req.headers.get("cookie") || "", host, doLog);
    return r && r.role ? { role: r.role, name: r.name === "admin" ? "Mestre" : r.name, glitch: r.glitch !== false } : { role: null, reason: r?.reason, glitch: r?.glitch };
  } catch (e) {
    return { role: null, down: true };
  }
}
async function tooMany(env, ip) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM attempts WHERE ip=? AND ts>?").bind(ip, Date.now() - 10 * 6e4).first();
  return (r?.n || 0) >= 40;
}
const dayBR = (t = Date.now()) => new Date(t - 3 * 36e5).toISOString().slice(0, 10);
async function docsWhere(env, b, since) {
  const { results } = since
    ? await env.DB.prepare("SELECT path, body FROM docs WHERE updated > ?").bind(since).all()
    : await env.DB.prepare("SELECT path, body FROM docs WHERE body != 'null'").all();
  const docs = {};
  for (const r of results) if (visible(r.path, b)) docs[r.path] = JSON.parse(r.body);
  return docs;
}
async function snapshot(env) {
  const day = dayBR();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM backup_docs WHERE day=?").bind(day),
    env.DB.prepare("INSERT INTO backup_docs(day,path,body) SELECT ?, path, body FROM docs WHERE body != 'null'").bind(day),
    env.DB.prepare("DELETE FROM backup_docs WHERE day < ?").bind(dayBR(Date.now() - 30 * 864e5)),
    env.DB.prepare("DELETE FROM attempts WHERE ts < ?").bind(Date.now() - 864e5),
  ]);
  return day;
}

async function api(req, env, url) {
  const p = url.pathname, method = req.method, b = boardOf(url), host = url.hostname;
  const ip = req.headers.get("cf-connecting-ip") || "x";
  if (p === "/api/ping") return json({ ok: true, board: b });
  if (p === "/api/login" && method === "POST") {
    if (await tooMany(env, ip)) return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
    const { pin = "", kind = "admin" } = await req.json().catch(() => ({}));
    if (!safeEq(await pinHash(env, String(pin)), await storedHash(env))) {
      await env.DB.prepare("INSERT INTO attempts(ip,ts) VALUES(?,?)").bind(ip, Date.now()).run();
      return json({ ok: false }, 403);
    }
    if (kind === "verify") return json({ ok: true });
    return json({ ok: true, role: "admin" }, 200, { "set-cookie": setCookie(await makeToken(env, "admin")) });
  }
  if (p === "/api/logout" && method === "POST") {
    const h = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
    h.append("set-cookie", "caos_c=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
    h.append("set-cookie", "caos_q=; Path=/; Domain=meucaos.com; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
    return new Response('{"ok":true}', { headers: h });
  }
  if (p === "/api/session") {
    const s = await session(req, env, host, true);
    return json({ ...s, board: b });
  }
  const s = await session(req, env, host, false);
  if (!s.role) return json({ error: "login" }, 401);
  const admin = s.role === "admin";
  if (p === "/api/demote" && method === "POST") return json({ ok: true, role: "view" }, 200, { "set-cookie": setCookie(await makeToken(env, "view")) });
  if (p === "/api/docs" && method === "GET") {
    // backup diário sem cron: o primeiro acesso do dia tira a foto
    if ((await getMeta(env, "snapDay")) !== dayBR()) { await snapshot(env); await setMeta(env, "snapDay", dayBR()); }
    return json({ docs: await docsWhere(env, b, 0), now: Date.now() });
  }
  if (p === "/api/changes" && method === "GET") {
    const since = +url.searchParams.get("since") || 0;
    return json({ docs: await docsWhere(env, b, since), now: Date.now() });
  }
  if (p === "/api/docs" && method === "POST") {
    const { ops } = await req.json().catch(() => ({}));
    if (!Array.isArray(ops) || !ops.length || ops.length > 600) return json({ error: "bad ops" }, 400);
    const now = Date.now(), stmts = [];
    for (const o of ops) {
      if (!o || typeof o.path !== "string" || !PATH_RE.test(o.path) || !visible(o.path, b)) return json({ error: "bad path " + o?.path }, 400);
      // a teia (estrelas e ligações) é do time; cadastros e identidade só no modo admin
      if (!admin && o.path.startsWith("app/")) return json({ error: "Ajustes exigem a senha de administrador." }, 403);
      const body = o.body === null ? "null" : JSON.stringify(o.body);
      if (body.length > 15e5) return json({ error: "Grande demais: " + o.path }, 413);
      stmts.push(env.DB.prepare("INSERT INTO docs(path,body,updated) VALUES(?,?,?) ON CONFLICT(path) DO UPDATE SET body=excluded.body, updated=excluded.updated").bind(o.path, body, now));
    }
    await env.DB.batch(stmts);
    return json({ ok: true, now });
  }
  if (!admin) return json({ error: "admin" }, 403);
  if (p === "/api/pin" && method === "POST") {
    const { pin } = await req.json().catch(() => ({}));
    if (String(pin || "").length < 4) return json({ error: "senha curta" }, 400);
    await setMeta(env, "adminHash", await pinHash(env, String(pin)));
    await setMeta(env, "pinVer", String(+(await pinVer(env)) + 1));
    return json({ ok: true }, 200, { "set-cookie": setCookie(await makeToken(env, "admin")) });
  }
  if (p === "/api/backups" && method === "GET") {
    const { results } = await env.DB.prepare("SELECT day, COUNT(*) AS n FROM backup_docs GROUP BY day ORDER BY day DESC").all();
    return json({ backups: results });
  }
  if (p === "/api/backups/now" && method === "POST") return json({ day: await snapshot(env) });
  const bm = p.match(/^\/api\/backups\/(\d{4}-\d{2}-\d{2})$/);
  if (bm && method === "GET") {
    const { results } = await env.DB.prepare("SELECT path, body FROM backup_docs WHERE day=?").bind(bm[1]).all();
    const docs = {};
    for (const r of results) if (visible(r.path, b)) docs[r.path] = JSON.parse(r.body);
    return json({ format: "constelacao-v1", board: b, exportedAt: bm[1], docs });
  }
  return json({ error: "not found" }, 404);
}

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS docs (path TEXT PRIMARY KEY, body TEXT NOT NULL, updated INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS backup_docs (day TEXT NOT NULL, path TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY (day, path))",
  "CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS attempts (ip TEXT NOT NULL, ts INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS attempts_ip ON attempts(ip, ts)",
  "CREATE INDEX IF NOT EXISTS docs_updated ON docs(updated)",
];
// adaptador mínimo no formato do D1 sobre o SQLite do Durable Object
function d1(storage) {
  const conv = (v) => (v === undefined ? null : typeof v === "boolean" ? (v ? 1 : 0) : v);
  const stmt = (q, args = []) => ({
    bind: (...a) => stmt(q, a.map(conv)),
    _x: () => storage.sql.exec(q, ...args).toArray(),
    async all() { return { results: this._x(), success: true }; },
    async first() { return this._x()[0] || null; },
    async run() { this._x(); return { success: true }; },
  });
  return {
    prepare: (q) => stmt(q),
    batch: async (list) => { storage.transactionSync(() => list.forEach((s) => s._x())); return list.map(() => ({ success: true })); },
  };
}
export class Store extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    for (const q of SCHEMA) ctx.storage.sql.exec(q);
    this.e = { ...env, DB: d1(ctx.storage) };
  }
  async fetch(req) {
    try {
      return await api(req, this.e, new URL(req.url));
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 500);
    }
  }
  async tick() {
    await snapshot(this.e);
    return true;
  }
}
const store = (env) => env.STORE.get(env.STORE.idFromName("main"));
const SEC = { "x-frame-options": "DENY", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "cache-control": "no-cache", "content-type": "text/html; charset=utf-8" };
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) return store(env).fetch(req);
    if (url.pathname === "/" || url.pathname === "/index.html") return new Response(HTML, { headers: SEC });
    return new Response("not found", { status: 404 });
  },
  async scheduled(ev, env, ctx) {
    ctx.waitUntil(store(env).tick());
  },
};
export class Tick extends WorkerEntrypoint {
  async run() {
    return store(this.env).tick();
  }
}
