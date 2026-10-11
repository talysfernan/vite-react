
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
import { WorkerEntrypoint, DurableObject } from "cloudflare:workers";
var enc = new TextEncoder();
var PATH_RE = /^(app|node|marca|time|pessoa)\/[A-Za-z0-9_\-.~:@+]{1,200}$/;
var VIEW_RE = /^node\//;
var MAX_FILE = 20 * 1024 * 1024;
var json = /* @__PURE__ */ __name((d, s = 200, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...h } }), "json");
var b64u = /* @__PURE__ */ __name((buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), "b64u");
async function sha(s) {
  return b64u(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}
__name(sha, "sha");
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}
__name(hmac, "hmac");
function safeEq(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
__name(safeEq, "safeEq");
async function getMeta(env, k) {
  const r = await env.DB.prepare("SELECT v FROM meta WHERE k=?").bind(k).first();
  return r ? r.v : null;
}
__name(getMeta, "getMeta");
async function setMeta(env, k, v) {
  await env.DB.prepare("INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(k, v).run();
}
__name(setMeta, "setMeta");
var pinHash = /* @__PURE__ */ __name((env, pin) => sha(env.SESSION_SECRET + ":pin:" + pin), "pinHash");
async function storedHash(env, kind) {
  return await getMeta(env, kind + "Hash") || pinHash(env, kind === "admin" ? "283644" : "1234");
}
__name(storedHash, "storedHash");
async function pinVer(env) {
  return await getMeta(env, "pinVer") || "1";
}
__name(pinVer, "pinVer");
async function makeToken(env, role) {
  const p = `${role}.${Date.now() + 12 * 36e5}.${await pinVer(env)}`;
  return p + "." + await hmac(env.SESSION_SECRET, p);
}
__name(makeToken, "makeToken");
var setCookie = /* @__PURE__ */ __name((t) => `caos_s=${t}; Path=/; HttpOnly; Secure; SameSite=Strict`, "setCookie");
async function ownSession(req, env) {
  const m = (req.headers.get("cookie") || "").match(/(?:^|;\s*)caos_s=([^;]+)/);
  if (!m) return null;
  const [role, exp, v, sig] = m[1].split(".");
  if (!sig) return null;
  if (!safeEq(await hmac(env.SESSION_SECRET, `${role}.${exp}.${v}`), sig)) return null;
  if (+exp < Date.now() || v !== await pinVer(env)) return null;
  return { role };
}
__name(ownSession, "ownSession");
async function session(req, env) {
  const own = await ownSession(req, env);
  if (own) return own;
  try {
    const r = await env.QUINTAL.check(req.headers.get("cookie") || "", env.PANEL_KEY, false);
    return r && r.role ? { role: r.role, name: r.name } : null;
  } catch (e) {
    return null;
  }
}
__name(session, "session");
async function tooMany(env, ip) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM attempts WHERE ip=? AND ts>?").bind(ip, Date.now() - 10 * 6e4).first();
  return (r?.n || 0) >= 40;
}
__name(tooMany, "tooMany");
var dayBR = /* @__PURE__ */ __name((t = Date.now()) => new Date(t - 3 * 36e5).toISOString().slice(0, 10), "dayBR");
async function allDocs(env) {
  const { results } = await env.DB.prepare("SELECT path, body FROM docs WHERE body != 'null'").all();
  const docs = {};
  for (const r of results) docs[r.path] = JSON.parse(r.body);
  return docs;
}
__name(allDocs, "allDocs");
async function snapshot(env) {
  const day = dayBR();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM backup_docs WHERE day=?").bind(day),
    env.DB.prepare("INSERT INTO backup_docs(day,path,body) SELECT ?, path, body FROM docs WHERE body != 'null'").bind(day),
    env.DB.prepare("DELETE FROM backup_docs WHERE day < ?").bind(dayBR(Date.now() - 30 * 864e5)),
    env.DB.prepare("DELETE FROM attempts WHERE ts < ?").bind(Date.now() - 864e5)
  ]);
  return day;
}
__name(snapshot, "snapshot");
async function api(req, env, url) {
  const p = url.pathname, method = req.method;
  const ip = req.headers.get("cf-connecting-ip") || "x";
  if (p === "/api/ping") return json({ ok: true });
  if (p === "/api/ver") return json({ v: env.CF_VERSION_METADATA?.id || "" });
  if (p === "/api/login" && method === "POST") {
    if (await tooMany(env, ip)) return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
    const { pin = "", kind = "pin" } = await req.json().catch(() => ({}));
    if (kind !== "admin") return json({ error: "sso" }, 403);
    const k = "admin";
    if (!safeEq(await pinHash(env, String(pin)), await storedHash(env, k))) {
      await env.DB.prepare("INSERT INTO attempts(ip,ts) VALUES(?,?)").bind(ip, Date.now()).run();
      return json({ ok: false }, 403);
    }
    const role = k === "admin" ? "admin" : "view";
    return json({ ok: true, role }, 200, { "set-cookie": setCookie(await makeToken(env, role)) });
  }
  if (p === "/api/logout" && method === "POST") {
    const h = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
    h.append("set-cookie", "caos_s=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
    h.append("set-cookie", "caos_q=; Path=/; Domain=meucaos.com; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
    return new Response('{"ok":true}', { headers: h });
  }
  if (p === "/api/export" && method === "GET") {
    const key = url.searchParams.get("key") || "";
    if (!env.EXPORT_KEY || !safeEq(key, env.EXPORT_KEY)) return json({ error: "forbidden" }, 403);
    return json({ format: "painel-caos-docs-v1", app: "caos-constelacao", exportedAt: (/* @__PURE__ */ new Date()).toISOString(), docs: await allDocs(env) });
  }
  if (p === "/api/session") {
    const own = await ownSession(req, env);
    if (own) return json({ role: own.role, name: "emerg\xEAncia", board: env.BOARD });
    try {
      const r = await env.QUINTAL.check(req.headers.get("cookie") || "", env.PANEL_KEY, true);
      return json({ role: r?.role || null, name: r?.name || null, reason: r?.reason || null, sso: true, glitch: r?.glitch !== false, board: env.BOARD });
    } catch (e) {
      return json({ role: null, down: true });
    }
  }
  const s = await session(req, env);
  if (!s) return json({ error: "login" }, 401);
  const admin = s.role === "admin";
  if (p === "/api/demote" && method === "POST") return json({ ok: true, role: "view" }, 200, { "set-cookie": setCookie(await makeToken(env, "view")) });
  if (p === "/api/docs" && method === "GET") return json({ docs: await allDocs(env), now: Date.now() });
  if (p === "/api/changes" && method === "GET") {
    const since = +url.searchParams.get("since") || 0;
    const { results } = await env.DB.prepare("SELECT path, body FROM docs WHERE updated > ?").bind(since).all();
    const docs = {};
    for (const r of results) docs[r.path] = JSON.parse(r.body);
    return json({ docs, now: Date.now() });
  }
  if (p === "/api/docs" && method === "POST") {
    const { ops } = await req.json().catch(() => ({}));
    if (!Array.isArray(ops) || !ops.length || ops.length > 400) return json({ error: "bad ops" }, 400);
    const empty = !await env.DB.prepare("SELECT 1 FROM docs WHERE body != 'null' LIMIT 1").first();
    const now = Date.now(), stmts = [];
    for (const o of ops) {
      if (!o || typeof o.path !== "string" || !PATH_RE.test(o.path)) return json({ error: "bad path " + o?.path }, 400);
      if (!admin && !empty && !VIEW_RE.test(o.path)) return json({ error: "admin" }, 403);
      const body = o.body === null ? "null" : JSON.stringify(o.body);
      if (body.length > 15e5) return json({ error: "too large " + o.path }, 413);
      stmts.push(env.DB.prepare("INSERT INTO docs(path,body,updated) VALUES(?,?,?) ON CONFLICT(path) DO UPDATE SET body=excluded.body, updated=excluded.updated").bind(o.path, body, now));
    }
    await env.DB.batch(stmts);
    return json({ ok: true, now });
  }
  if (!admin) return json({ error: "admin" }, 403);
  if (p === "/api/pin" && method === "POST") {
    const { kind, pin } = await req.json().catch(() => ({}));
    if (kind !== "admin" || String(pin || "").length < 4) return json({ error: "bad pin" }, 400);
    await setMeta(env, kind + "Hash", await pinHash(env, String(pin)));
    await setMeta(env, "pinVer", String(+await pinVer(env) + 1));
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
    for (const r of results) docs[r.path] = JSON.parse(r.body);
    return json({ format: "painel-caos-docs-v1", app: "caos-constelacao", exportedAt: bm[1], docs });
  }
  return json({ error: "not found" }, 404);
}
__name(api, "api");
var SCHEMA = ["CREATE TABLE IF NOT EXISTS docs (path TEXT PRIMARY KEY, body TEXT NOT NULL, updated INTEGER NOT NULL)", "CREATE TABLE IF NOT EXISTS backup_docs (day TEXT NOT NULL, path TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY (day, path))", "CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)", "CREATE TABLE IF NOT EXISTS attempts (ip TEXT NOT NULL, ts INTEGER NOT NULL)", "CREATE INDEX IF NOT EXISTS attempts_ip ON attempts(ip, ts)", "CREATE INDEX IF NOT EXISTS docs_updated ON docs(updated)"];
function d1(storage) {
  const conv = /* @__PURE__ */ __name((v) => v === void 0 ? null : typeof v === "boolean" ? v ? 1 : 0 : v, "conv");
  const stmt = /* @__PURE__ */ __name((q, args = []) => ({
    bind: /* @__PURE__ */ __name((...a) => stmt(q, a.map(conv)), "bind"),
    _x: /* @__PURE__ */ __name(() => storage.sql.exec(q, ...args).toArray(), "_x"),
    async all() {
      return { results: this._x(), success: true };
    },
    async first() {
      return this._x()[0] || null;
    },
    async run() {
      this._x();
      return { success: true };
    }
  }), "stmt");
  return { prepare: /* @__PURE__ */ __name((q) => stmt(q), "prepare"), batch: /* @__PURE__ */ __name(async (list) => {
    storage.transactionSync(() => list.forEach((s) => s._x()));
    return list.map(() => ({ success: true }));
  }, "batch") };
}
__name(d1, "d1");
var Store = class extends DurableObject {
  static {
    __name(this, "Store");
  }
  constructor(ctx, env) {
    super(ctx, env);
    for (const q of SCHEMA) ctx.storage.sql.exec(q);
    this.e = { ...env, DB: d1(ctx.storage) };
  }
  async fetch(req) {
    const url = new URL(req.url), b = req.headers.get("x-board") === "us" ? "us" : "br";
    try {
      return await api(req, { ...this.e, BOARD: b, PANEL_KEY: "constelacao-" + b }, url);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  }
  async tick(t) {
    const d = new Date(t || Date.now());
    if (d.getUTCHours() === 1 && d.getUTCMinutes() >= 50 && d.getUTCMinutes() < 55) await snapshot(this.e);
    return true;
  }
};
var BOARDS = ["br", "us"];
var boardOf = /* @__PURE__ */ __name((url) => /^constelacao-us\./.test(url.hostname) ? "us" : "br", "boardOf");
var store = /* @__PURE__ */ __name((env, b) => env.STORE.get(env.STORE.idFromName(b)), "store");
var SEC = { "x-frame-options": "DENY", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "cache-control": "no-cache" };
var index_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      {
        const b = boardOf(url), r2 = new Request(req);
        r2.headers.set("x-board", b);
        return store(env, b).fetch(r2);
      }
    }
    const res = await env.ASSETS.fetch(req);
    const r = new Response(res.body, res);
    for (const [k, v] of Object.entries(SEC)) r.headers.set(k, v);
    return r;
  }
};
var Tick = class extends WorkerEntrypoint {
  static {
    __name(this, "Tick");
  }
  async run(t) {
    for (const b of BOARDS) await store(this.env, b).tick(t);
    return true;
  }
};
export {
  Store,
  Tick,
  index_default as default
};

