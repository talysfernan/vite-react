var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
import { WorkerEntrypoint } from "cloudflare:workers";
var enc = new TextEncoder();
var PATH_RE = /^(cfg|brands|products|channels|operators|partners)\/[A-Za-z0-9_\-.~:@+]{1,200}$/;
var VIEW_RE = /^partners\//;
var MAX_FILE = 20 * 1024 * 1024;
var PART = 18e5;
var FILE_TYPES = /^(image\/(jpeg|png|webp|gif|svg\+xml|heic|heif)|application\/pdf)$/;
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
var PANEL_KEY = "parceiros";
async function session(req, env) {
  const own = await ownSession(req, env);
  if (own) return own;
  try {
    const r = await env.QUINTAL.check(req.headers.get("cookie") || "", env.PANEL_KEY || PANEL_KEY, false);
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
    return json({ format: "painel-caos-docs-v1", app: "caos-parceiros", board: env.BOARD || "br", exportedAt: (/* @__PURE__ */ new Date()).toISOString(), docs: await allDocs(env) });
  }
  if (p === "/api/session") {
    const own = await ownSession(req, env);
    if (own) return json({ role: own.role, name: "emerg\xEAncia" });
    try {
      const r = await env.QUINTAL.check(req.headers.get("cookie") || "", env.PANEL_KEY || PANEL_KEY, true);
      return json({ role: r?.role || null, name: r?.name || null, reason: r?.reason || null, sso: true, glitch: r?.glitch !== false });
    } catch (e) {
      return json({ role: null, down: true });
    }
  }
  const s = await session(req, env);
  if (!s) return json({ error: "login" }, 401);
  const admin = s.role === "admin";
  if (p === "/api/demote" && method === "POST") return json({ ok: true, role: "view" }, 200, { "set-cookie": setCookie(await makeToken(env, "view")) });
  if (p === "/api/files" && method === "POST") {
    const ty = (req.headers.get("content-type") || "").split(";")[0].trim();
    if (!FILE_TYPES.test(ty)) return json({ error: "tipo" }, 415);
    const buf = new Uint8Array(await req.arrayBuffer());
    if (!buf.length) return json({ error: "vazio" }, 400);
    if (buf.length > MAX_FILE) return json({ error: "too_large" }, 413);
    const id = "f" + Date.now().toString(36) + crypto.getRandomValues(new Uint32Array(2)).join("").slice(0, 10);
    const parts = Math.ceil(buf.length / PART), stmts = [];
    for (let i = 0; i < parts; i++) stmts.push(env.DB.prepare("INSERT INTO file_parts(id,idx,data) VALUES(?,?,?)").bind(id, i, buf.subarray(i * PART, (i + 1) * PART)));
    for (let i = 0; i < stmts.length; i++) await stmts[i].run();
    await env.DB.prepare("INSERT INTO files(id,ty,size,parts,created) VALUES(?,?,?,?,?)").bind(id, ty, buf.length, parts, Date.now()).run();
    return json({ id });
  }
  const fm = p.match(/^\/api\/files\/([A-Za-z0-9]{4,40})$/);
  if (fm && method === "DELETE") {
    await env.DB.batch([env.DB.prepare("DELETE FROM file_parts WHERE id=?").bind(fm[1]), env.DB.prepare("DELETE FROM files WHERE id=?").bind(fm[1])]);
    return json({ ok: true });
  }
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
    return json({ format: "painel-caos-docs-v1", app: "caos-parceiros", exportedAt: bm[1], docs });
  }
  return json({ error: "not found" }, 404);
}
__name(api, "api");
var SEC = { "x-frame-options": "DENY", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "cache-control": "no-cache" };
var index_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await api(req, env, url);
      } catch (e) {
        return json({ error: String(e && e.message || e) }, 500);
      }
    }
    const bm = url.pathname.match(/^\/_blob\/([A-Za-z0-9]{4,40})$/);
    if (bm) {
      if (!await session(req, env)) return new Response("login", { status: 401 });
      const f = await env.DB.prepare("SELECT ty, size, parts FROM files WHERE id=?").bind(bm[1]).first();
      if (!f) return new Response("not found", { status: 404 });
      const out = new Uint8Array(f.size);
      let off = 0;
      for (let i = 0; i < f.parts; i++) {
        const r2 = await env.DB.prepare("SELECT data FROM file_parts WHERE id=? AND idx=?").bind(bm[1], i).first();
        const d = new Uint8Array(r2.data);
        out.set(d, off);
        off += d.length;
      }
      return new Response(out, { headers: { "content-type": f.ty, "cache-control": "private, max-age=31536000, immutable", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox" } });
    }
    const res = await env.ASSETS.fetch(req);
    const r = new Response(res.body, res);
    for (const [k, v] of Object.entries(SEC)) r.headers.set(k, v);
    return r;
  },
  async scheduled(ev, env, ctx) {
    ctx.waitUntil(snapshot(env));
  }
};
var STEPS = { A: ["contato", "aceite", "envio", "entrega", "conteudo"], B: ["contato", "aceite", "compra", "reembolso", "recebido", "review"], C: ["contato", "aceite", "compra", "reembolso", "recebido", "conteudo"] };
/* selo "Apto para review" acrescenta a etapa de review nas frentes A e C */
var stepsK = (p) => (STEPS[p.model] || []).concat(p.reviewOk && p.model !== "B" ? ["review"] : []);
var STEP_L = { contato: "Contato iniciado", aceite: "Aceite", envio: "Produto enviado", entrega: "Produto entregue", conteudo: "Conte\xFAdo publicado", compra: "Compra realizada", reembolso: "Reembolso feito", recebido: "Produto recebido", review: "Review publicado" };
async function getDoc(env, path) {
  const r = await env.DB.prepare("SELECT body FROM docs WHERE path=?").bind(path).first();
  return r && r.body !== "null" ? JSON.parse(r.body) : null;
}
__name(getDoc, "getDoc");
async function putDoc(env, path, body) {
  await env.DB.prepare("INSERT INTO docs(path,body,updated) VALUES(?,?,?) ON CONFLICT(path) DO UPDATE SET body=excluded.body, updated=excluded.updated").bind(path, JSON.stringify(body), Date.now()).run();
}
__name(putDoc, "putDoc");
var rsn = /* @__PURE__ */ __name((a, b) => [a, b].map((x) => String(x || "").trim()).filter(Boolean).join(" \u2014 "), "rsn");
function decideReq(p, rid, accept, note, by) {
  const r = (p.reqs || []).find((z) => z.id === rid);
  if (!r || r.status !== "pending") return false;
  const log = /* @__PURE__ */ __name((x) => (p.log ||= []).push({ t: Date.now(), by, x }), "log");
  r.status = accept ? "accepted" : "rejected";
  r.decidedAt = Date.now();
  r.decidedBy = by;
  if (note) r.note = note;
  if (accept && r.type === "dead") {
    p.status = "dead";
    p.deadAt = Date.now();
    p.deadReasonType = r.reasonType || "";
    p.deadReason = rsn(r.reasonType, r.reason);
    p.deadBy = r.by;
    log(`Baixa aprovada: ${p.deadReason}`);
  } else if (accept && r.type === "delete") {
    r.deleted = true;
    return true;
  } else if (accept && r.type === "restore") {
    p.status = "open";
    delete p.deadAt;
    log("Restaurada");
    if (stepsK(p).every((k) => p.steps?.[k])) {
      p.status = "done";
      p.doneAt ||= Date.now();
    }
  } else if (accept && r.type === "review") {
    if (!p.reviewOk) {
      p.reviewOk = true;
      p.reviewOkAt = Date.now();
      log("Selo Apto para review ativado");
      if (p.status === "done") {
        p.status = "open";
        delete p.doneAt;
        log("Reaberta para a etapa de review");
      }
    }
  } else log(`Solicita\xE7\xE3o recusada${note ? ": " + note : ""}`);
  return true;
}
__name(decideReq, "decideReq");
var dbsOf = /* @__PURE__ */ __name((env) => env.DB_US ? { br: env.DB, us: env.DB_US } : { br: env.DB }, "dbsOf");
var Inbox = class extends WorkerEntrypoint {
  static {
    __name(this, "Inbox");
  }
  async list() {
    const items = [];
    for (const [b, db] of Object.entries(dbsOf(this.env))) items.push(...await this.list1({ DB: db }, b));
    return { key: "parceiros", name: "Projeto Parceiros", url: "https://parceiros-do.meucaos.com", items };
  }
  async list1(env, b) {
    const { results } = await env.DB.prepare(`SELECT path, body FROM docs WHERE (path LIKE 'partners/%' AND body LIKE '%"reqs"%') OR path LIKE 'brands/%'`).all();
    const brands = {}, ps = [];
    for (const r of results) {
      if (r.body === "null") continue;
      const v = JSON.parse(r.body);
      if (r.path.startsWith("brands/")) brands[v.id] = v.name;
      else ps.push(v);
    }
    const items = [], week = Date.now() - 7 * 864e5;
    for (const p of ps) for (const r of p.reqs || []) {
      if (r.status !== "pending" && !(r.decidedAt > week)) continue;
      const done = stepsK(p).filter((k) => p.steps?.[k]);
      items.push({ id: p.id, rid: r.id, title: "@" + (p.handle || ""), brand: (brands[p.brandId] || "") + (b === "us" ? " \xB7 EUA" : ""), model: p.model, stage: p.status === "dead" ? "Baixada" : STEP_L[done[done.length - 1]] || "", type: r.type, label: r.type === "dead" ? "Dar baixa" : r.type === "delete" ? "Excluir registro" : r.type === "review" ? "Selo Apto para review" : "Restaurar", reason: rsn(r.reasonType, r.reason), by: r.by || "", ts: r.ts, status: r.status, decidedAt: r.decidedAt || null, note: r.note || "", occ: (p.occ || []).length, link: "/?pais=" + b + "&p=" + p.id });
    }
    return items;
  }
  async decide(id, rid, accept, note, by) {
    const path = "partners/" + id;
    for (const db of Object.values(dbsOf(this.env))) if (await getDoc({ DB: db }, path)) return this.decide1({ DB: db }, path, rid, accept, note, by);
    return { ok: false, error: "n\xE3o encontrado" };
  }
  async decide1(env, path, rid, accept, note, by) {
    const p = await getDoc(env, path);
    if (!p) return { ok: false, error: "n\xE3o encontrado" };
    if (!decideReq(p, rid, !!accept, String(note || "").slice(0, 300), String(by || "admin").slice(0, 60))) return { ok: false, error: "j\xE1 decidida" };
    const r = p.reqs.find((z) => z.id === rid);
    if (r && r.deleted) {
      const ids = ["purchasePrints", "refundProofs", "reviewPrints", "contentPrints"].flatMap((k) => (p[k] || []).filter((a) => a && a.k === "a").map((a) => a.id));
      for (const id2 of ids) await env.DB.batch([env.DB.prepare("DELETE FROM file_parts WHERE id=?").bind(id2), env.DB.prepare("DELETE FROM files WHERE id=?").bind(id2)]);
      await env.DB.prepare("UPDATE docs SET body=?, updated=? WHERE path=?").bind("null", Date.now(), path).run();
      return { ok: true, deleted: true };
    }
    await putDoc(env, path, p);
    return { ok: true };
  }
};
export {
  Inbox,
  index_default as default
};
//# sourceMappingURL=index.js.map
