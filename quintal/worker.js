var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
import { WorkerEntrypoint } from "cloudflare:workers";
var enc = new TextEncoder();
function json(d, s = 200, h = {}) {
  const H = new Headers({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  for (const [k, v] of Object.entries(h)) {
    if (k === "set-cookie") {
      if (DOM) H.append("set-cookie", clearHostCookie);
      H.append("set-cookie", v);
    } else H.set(k, v);
  }
  return new Response(JSON.stringify(d), { status: s, headers: H });
}
__name(json, "json");
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
  a = String(a);
  b = String(b);
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
__name(safeEq, "safeEq");
var norm = /* @__PURE__ */ __name((s) => String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""), "norm");
var hostOf = /* @__PURE__ */ __name((u) => {
  try {
    return new URL(u).host;
  } catch (e) {
    return "";
  }
}, "hostOf");
var PANELS0 = [
  { id: "p1", key: "mensal", name: "An\xE1lise mensal", url: "https://analise-mensal.meucaos.com", desc: "Fechamento do m\xEAs, DRE e canais", color: "#60a5fa", icon: "M" },
  { id: "p2", key: "semanal", name: "An\xE1lise semanal", url: "https://analise-semanal.meucaos.com", desc: "Acompanhamento da semana", color: "#4ade80", icon: "S" },
  { id: "p3", key: "rotina", name: "CAO(S) Rotina", url: "https://bem-vindo-ao.meucaos.com", desc: "Cards, contadores e mascotes", color: "#f472b6", icon: "R" },
  { id: "p4", key: "parceiros", name: "Projeto Parceiros", url: "https://parceiros-do.meucaos.com", desc: "Influenciadores, UGC e reviews", color: "#fb923c", icon: "P" }
];
var CFG0 = { title: { text: "Quintal do CAO(S)", color: "#26262b", size: 15 }, logo: "", logoSize: 90, greet: "Escolha um painel", newTab: true, glitch: true, layout: "cards", mascot: true, masterUser: "mestre", areas: [], cats: [] };
var AREAS0 = [
  { id: "a_tools", name: "Ferramentas", theme: "base", icon: "wrench", sub: "" },
  { id: "a_rot", name: "Rotina", theme: "violet", icon: "users", sub: "A rotina de cada um" },
  { id: "a_mkt", name: "Marketing", theme: "mkt", icon: "mega", sub: "Estrat\xE9gias, campanhas e fluxos" },
  { id: "a_dir", name: "Diretoria", theme: "gold", icon: "crown", sub: "Vis\xE3o do grupo e decis\xF5es" },
  { id: "a_ctrl", name: "Controladoria", theme: "teal", icon: "chart", sub: "N\xFAmeros, custos e resultados" }
];
var CATS0 = [{ id: "c_pain", name: "Pain\xE9is", area: "a_tools" }, { id: "c_rot", name: "Rotinas", area: "a_rot" }, { id: "c_colab", name: "Colaboradores", area: "a_tools" }, { id: "c_mkt_est", name: "Estrat\xE9gias", area: "a_mkt" }, { id: "c_mkt_flx", name: "Fluxos", area: "a_mkt" }];
var THEMES = ["base", "mkt", "gold", "teal", "blue", "violet"];
var ICONS = ["wrench", "mega", "crown", "chart", "star", "users", "grid", "db", "brush", "shield"];
var ROT_BASE = "https://rotina.meucaos.com/";
var SLUG_RE = /^[a-z0-9][a-z0-9-]{1,29}$/;
var LV = { view: 1, admin: 2 };
var lvMax = /* @__PURE__ */ __name((a, b) => (LV[a] || 0) >= (LV[b] || 0) ? a : b, "lvMax");
var slug = /* @__PURE__ */ __name((s) => norm(s).replace(/[^a-z0-9._-]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 30), "slug");
var putKV = /* @__PURE__ */ __name((env, k, v) => env.DB.prepare("INSERT INTO kv(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(k, JSON.stringify(v)), "putKV");
async function loadAll(env) {
  const { results } = await env.DB.prepare("SELECT k, v FROM kv").all();
  const m = Object.fromEntries(results.map((r) => [r.k, JSON.parse(r.v)]));
  if (!m.panels) {
    m.panels = PANELS0;
    m.cfg = { ...CFG0, ...m.cfg || {} };
    m.users = m.users || [];
    await env.DB.batch([putKV(env, "panels", m.panels), putKV(env, "cfg", m.cfg), putKV(env, "users", m.users)]);
  }
  m.cfg = { ...CFG0, ...m.cfg || {} };
  m.cfg.title = { ...CFG0.title, ...m.cfg.title || {} };
  m.users = m.users || [];
  const K = { p1: "mensal", p2: "semanal", p3: "rotina", p4: "parceiros" };
  m.panels.forEach((x) => {
    if (x.key === void 0 && K[x.id]) x.key = K[x.id];
  });
  m.users.forEach((u) => {
    if (!Array.isArray(u.admin)) u.admin = [];
  });
  if (!Array.isArray(m.cfg.areas) || !m.cfg.areas.length) m.cfg.areas = AREAS0.map((a) => ({ ...a }));
  const A = m.cfg.areas, aid = /* @__PURE__ */ __name((id) => A.some((a) => a.id === id) ? id : A[0].id, "aid");
  if (!Array.isArray(m.cfg.cats) || !m.cfg.cats.length) {
    const cats = CATS0.map((c) => ({ ...c }));
    m.panels.forEach((x) => {
      const n = String(x.cat || "").trim() || "Pain\xE9is";
      let c = cats.find((y) => y.id === x.cat || norm(y.name) === norm(n));
      if (!c) {
        c = { id: "c_" + Math.random().toString(36).slice(2, 8), name: n, area: "a_tools" };
        cats.push(c);
      }
      x.cat = c.id;
    });
    m.cfg.cats = cats;
  }
  m.cfg.cats.forEach((c) => {
    if (c.area === "mkt") c.area = "a_mkt";
    else if (c.dir) c.area = "a_dir";
    else if (!c.area || c.area === "tools") c.area = "a_tools";
    c.area = aid(c.area);
    delete c.dir;
  });
  if (!m.cfg.mktInit && !m.cfg.cats.some((c) => c.area === "a_mkt")) m.cfg.cats.push({ id: "c_mkt_est", name: "Estrat\xE9gias", area: "a_mkt" }, { id: "c_mkt_flx", name: "Fluxos", area: "a_mkt" });
  m.panels.forEach((x) => {
    if (!m.cfg.cats.some((c) => c.id === x.cat)) x.cat = m.cfg.cats[0].id;
  });
  m.users.forEach((u) => {
    if (!u.user) u.user = slug(u.name) || u.id;
    if (!Array.isArray(u.teams)) u.teams = [];
  });
  if (!Array.isArray(m.cfg.teams)) m.cfg.teams = [];
  if (!m.cfg.rotInit) {
    if (!m.cfg.areas.some((a) => a.id === "a_rot")) m.cfg.areas.splice(1, 0, { id: "a_rot", name: "Rotina", theme: "violet", icon: "users", sub: "A rotina de cada um" });
    if (!m.cfg.cats.some((c) => c.area === "a_rot")) m.cfg.cats.push({ id: "c_rot", name: "Rotinas", area: "a_rot" });
    const rc = m.cfg.cats.find((c) => c.area === "a_rot").id;
    for (const [key, un] of [["charles", "charles"], ["rotina", "talys"]]) {
      const p = m.panels.find((x) => x.key === key);
      if (!p || p.kind) continue;
      const u = m.users.find((x) => x.user === un);
      p.kind = "rotina";
      p.owner = u ? u.id : "";
      p.ownerRole = "admin";
      p.cat = rc;
      m.users.forEach((x) => {
        x.access = x.access.filter((id) => id !== p.id);
        x.admin = (x.admin || []).filter((id) => id !== p.id);
      });
    }
  }
  delete m.cfg.mine;
  return m;
}
__name(loadAll, "loadAll");
async function getMeta(env, k) {
  const r = await env.DB.prepare("SELECT v FROM meta WHERE k=?").bind(k).first();
  return r ? r.v : null;
}
__name(getMeta, "getMeta");
async function setMeta(env, k, v) {
  await env.DB.prepare("INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(k, v).run();
}
__name(setMeta, "setMeta");
var passHash = /* @__PURE__ */ __name((env, p) => sha(env.SESSION_SECRET + ":pass:" + p), "passHash");
async function adminHash(env) {
  return await getMeta(env, "adminHash") || passHash(env, "283644");
}
__name(adminHash, "adminHash");
async function pinVer(env) {
  return await getMeta(env, "pinVer") || "1";
}
__name(pinVer, "pinVer");
async function makeToken(env, role, uid, ver) {
  const p = `${role}.${uid}.${Date.now() + 12 * 36e5}.${ver}`;
  return p + "." + await hmac(env.SESSION_SECRET, p);
}
__name(makeToken, "makeToken");
var DOM = "; Domain=meucaos.com";
var setCookie = /* @__PURE__ */ __name((t) => `caos_q=${t}; Path=/${DOM}; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`, "setCookie");
var clearCookie = /* @__PURE__ */ __name(() => `caos_q=; Path=/${DOM}; HttpOnly; Secure; SameSite=Lax; Max-Age=0`, "clearCookie");
var clearHostCookie = "caos_q=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
var session = /* @__PURE__ */ __name((req, env, data) => sessionFrom(req.headers.get("cookie") || "", env, data), "session");
async function sessionFrom(cookie, env, data) {
  for (const m of String(cookie).matchAll(/(?:^|;\s*)caos_q=([^;]+)/g)) {
    const s = await sessionTok(m[1], env, data);
    if (s) return s;
  }
  return null;
}
__name(sessionFrom, "sessionFrom");
async function sessionTok(tok, env, data) {
  const [role, uid, exp, ver, sig] = tok.split(".");
  if (!sig) return null;
  if (!safeEq(await hmac(env.SESSION_SECRET, `${role}.${uid}.${exp}.${ver}`), sig) || +exp < Date.now()) return null;
  if (role === "admin") return ver === await pinVer(env) ? { role } : null;
  const u = data.users.find((x) => x.id === uid);
  if (!u || !u.active || userVer(u) !== ver) return null;
  return { role: "user", user: u };
}
__name(sessionTok, "sessionTok");
var userVer = /* @__PURE__ */ __name((u) => (u.pass || "-").slice(0, 10), "userVer");
var ELEV_MS = 15 * 6e4;
async function makeElev(env) {
  const p = `elev.${Date.now() + ELEV_MS}.${await pinVer(env)}`;
  return p + "." + await hmac(env.SESSION_SECRET + ":elev", p);
}
__name(makeElev, "makeElev");
async function elevated(req, env) {
  const m = (req.headers.get("cookie") || "").match(/(?:^|;\s*)caos_qe=([^;]+)/);
  if (!m) return false;
  const [a, exp, v, sig] = m[1].split(".");
  if (!sig) return false;
  return safeEq(await hmac(env.SESSION_SECRET + ":elev", `${a}.${exp}.${v}`), sig) && +exp > Date.now() && v === await pinVer(env);
}
__name(elevated, "elevated");
async function encKey(env) {
  return crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", enc.encode(env.SESSION_SECRET + ":vault")), "AES-GCM", false, ["encrypt", "decrypt"]);
}
__name(encKey, "encKey");
async function encPass(env, txt) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encKey(env), enc.encode(txt));
  return b64u(iv) + "." + b64u(c);
}
__name(encPass, "encPass");
var unb64u = /* @__PURE__ */ __name((s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0)), "unb64u");
async function decPass(env, s) {
  try {
    const [iv, c] = s.split(".");
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(iv) }, await encKey(env), unb64u(c)));
  } catch (e) {
    return null;
  }
}
__name(decPass, "decPass");
async function tooMany(env, ip) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM attempts WHERE ip=? AND ts>?").bind(ip, Date.now() - 10 * 6e4).first();
  return (r?.n || 0) >= 40;
}
__name(tooMany, "tooMany");
var fail = /* @__PURE__ */ __name((env, ip) => env.DB.prepare("INSERT INTO attempts(ip,ts) VALUES(?,?)").bind(ip, Date.now()).run(), "fail");
var logIt = /* @__PURE__ */ __name((env, user, panel, ok) => env.DB.prepare("INSERT INTO log(t,user,panel,ok) VALUES(?,?,?,?)").bind(Date.now(), String(user).slice(0, 60), String(panel).slice(0, 80), ok ? 1 : 0).run(), "logIt");
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var CODE_MS = 10 * 6e4;
var CODES_SQL = "CREATE TABLE IF NOT EXISTS codes (uid TEXT PRIMARY KEY, hash TEXT NOT NULL, exp INTEGER NOT NULL, tries INTEGER NOT NULL, n INTEGER NOT NULL, since INTEGER NOT NULL)";
var codeHash = /* @__PURE__ */ __name((env, uid, code) => sha(env.SESSION_SECRET + ":code:" + uid + ":" + code), "codeHash");
function byLogin(data, who) {
  const w = String(who || "").trim().toLowerCase();
  if (!w) return null;
  const u = w.includes("@") ? data.users.find((x) => String(x.email || "").toLowerCase() === w) : data.users.find((x) => x.user === slug(w));
  return u && u.active && EMAIL_RE.test(u.email || "") ? u : null;
}
__name(byLogin, "byLogin");
var escH = /* @__PURE__ */ __name((t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]), "escH");
function codeMail(u, code) {
  const first = escH(String(u.name || "").trim().split(/\s+/)[0] || "");
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0b0b0d"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0d;padding:40px 16px"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:420px;width:100%;background:#17171a;border:1px solid #2a2a30;border-radius:18px;font-family:Inter,'Segoe UI',system-ui,-apple-system,Roboto,Arial,sans-serif;color:#ededf0">
<tr><td style="padding:30px 30px 6px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#85858e">CAO(S) \xB7 Quintal</td></tr>
<tr><td style="padding:6px 30px 0;font-size:15px;color:#b6b6be">${first ? `Oi, ${first}. ` : ""}Seu c\xF3digo para entrar:</td></tr>
<tr><td style="padding:18px 30px"><div style="background:#141416;border:1px solid #2a2a30;border-radius:12px;padding:18px 0;text-align:center;font-size:34px;font-weight:700;letter-spacing:.32em;color:#ededf0;font-family:'SF Mono',Consolas,Menlo,monospace">${code}</div></td></tr>
<tr><td style="padding:0 30px 30px;font-size:12px;line-height:1.6;color:#85858e">Vale por 10 minutos. Se n\xE3o foi voc\xEA, ignore este e-mail.</td></tr>
</table></td></tr></table></body></html>`;
}
__name(codeMail, "codeMail");
var CFG = CFG0;
function levelOf(u, p) {
  if (!u || !p) return null;
  if (p.kind === "rotina") return p.owner && p.owner === u.id ? p.ownerRole || "admin" : null;
  let lv = u.access.includes(p.id) ? (u.admin || []).includes(p.id) ? "admin" : "view" : null;
  for (const t of CFG.teams || []) if ((u.teams || []).includes(t.id) && t.access?.[p.id]) lv = lvMax(lv, t.access[p.id]);
  return lv;
}
__name(levelOf, "levelOf");
var canOpen = /* @__PURE__ */ __name((s, p) => !!s && (s.role === "admin" || !!levelOf(s.user, p)), "canOpen");
var roleIn = /* @__PURE__ */ __name((s, p) => !s || !p ? null : s.role === "admin" ? "admin" : levelOf(s.user, p), "roleIn");
var pathOf = /* @__PURE__ */ __name((u) => {
  try {
    return new URL(u).pathname.replace(/\/+$/, "");
  } catch (e) {
    return "";
  }
}, "pathOf");
function pubPanel(p, data) {
  const o = { id: p.id, name: p.name, desc: p.desc, color: p.color, icon: p.icon, cat: p.cat || "", host: hostOf(p.url), at: hostOf(p.url) + pathOf(p.url) };
  if (p.kind === "rotina") {
    o.kind = "rotina";
    o.ownerName = (data.users.find((u) => u.id === p.owner) || {}).name || (p.owner ? "" : "mestre");
  }
  return o;
}
__name(pubPanel, "pubPanel");
var me = /* @__PURE__ */ __name((s) => !s ? null : s.role === "admin" ? { role: "admin", name: "Mestre" } : { role: "user", name: s.user.name, user: s.user.user, cargo: s.user.cargo || "", access: s.user.access }, "me");
var dayBR = /* @__PURE__ */ __name((t = Date.now()) => new Date(t - 3 * 36e5).toISOString().slice(0, 10), "dayBR");
async function snapshot(env) {
  const day = dayBR();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM backup_kv WHERE day=?").bind(day),
    env.DB.prepare("INSERT INTO backup_kv(day,k,v) SELECT ?, k, v FROM kv").bind(day),
    env.DB.prepare("DELETE FROM backup_kv WHERE day < ?").bind(dayBR(Date.now() - 30 * 864e5)),
    env.DB.prepare("DELETE FROM attempts WHERE ts < ?").bind(Date.now() - 864e5),
    env.DB.prepare("DELETE FROM log WHERE id NOT IN (SELECT id FROM log ORDER BY id DESC LIMIT 5000)")
  ]);
  return day;
}
__name(snapshot, "snapshot");
var clean = /* @__PURE__ */ __name((v, n) => String(v ?? "").slice(0, n), "clean");
var KEYC = /* @__PURE__ */ __name((v) => String(v || "").trim().toLowerCase().replace(/[^a-z0-9:_-]/g, "").slice(0, 30), "KEYC");
var COLOR = /* @__PURE__ */ __name((c) => /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#60a5fa", "COLOR");
async function api(req, env, url) {
  const p = url.pathname, method = req.method, ip = req.headers.get("cf-connecting-ip") || "x";
  if (p === "/api/export" && method === "GET") {
    if (!env.EXPORT_KEY || !safeEq(url.searchParams.get("key") || "", env.EXPORT_KEY)) return json({ error: "forbidden" }, 403);
    const d = await loadAll(env);
    return json({ format: "painel-caos-docs-v1", app: "caos-quintal", exportedAt: (/* @__PURE__ */ new Date()).toISOString(), docs: { "app/cfg": d.cfg, "app/panels": d.panels, "app/users": d.users } });
  }
  const data = await loadAll(env);
  CFG = data.cfg;
  const s = await session(req, env, data);
  if (p === "/api/hub" && method === "GET") {
    const c = data.cfg, pub = { title: c.title, logo: c.logo, logoSize: c.logoSize, glitch: c.glitch, layout: c.layout, mascot: c.mascot, newTab: c.newTab, greet: c.greet };
    if (!s) return json({ cfg: { ...pub, areas: [], cats: [] }, panels: [], me: null });
    const P = data.panels.filter((x) => canOpen(s, x)), catIds = new Set(P.map((x) => x.cat)), cats = c.cats.filter((x) => s.role === "admin" || catIds.has(x.id)), areaIds = new Set(cats.map((x) => x.area));
    return json({ cfg: { ...pub, areas: c.areas.filter((a) => s.role === "admin" || areaIds.has(a.id)), cats }, panels: P.map((x) => pubPanel(x, data)), me: me(s) });
  }
  if (p === "/api/logout" && method === "POST") return json({ ok: true }, 200, { "set-cookie": clearCookie() });
  if (p === "/api/login" && method === "POST") {
    if (await tooMany(env, ip)) return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
    const b = await req.json().catch(() => ({}));
    const pass = String(b.pass || ""), who = slug(b.user || b.name || "");
    const isMaster = pass && safeEq(await passHash(env, pass), await adminHash(env));
    if (isMaster && (b.kind === "admin" || who === slug(data.cfg.masterUser || "mestre"))) {
      if (b.kind !== "admin") await logIt(env, "mestre", "Quintal \xB7 entrou", true);
      return json({ ok: true, role: "admin" }, 200, { "set-cookie": setCookie(await makeToken(env, "admin", "-", await pinVer(env))) });
    }
    if (b.kind === "admin") {
      await fail(env, ip);
      return json({ ok: false }, 403);
    }
    const u = data.users.find((x) => x.user && x.user === who);
    if (!u || !u.pass || !safeEq(await passHash(env, pass), u.pass)) {
      await fail(env, ip);
      await logIt(env, clean(b.user, 40) || "?", "Quintal \xB7 senha incorreta", false);
      return json({ ok: false, error: "Usu\xE1rio ou senha incorretos" }, 403);
    }
    if (!u.active) {
      await logIt(env, u.name, "Quintal \xB7 usu\xE1rio desativado", false);
      return json({ ok: false, error: "Usu\xE1rio desativado" }, 403);
    }
    await logIt(env, u.name, "Quintal \xB7 entrou", true);
    return json({ ok: true, role: "user" }, 200, { "set-cookie": setCookie(await makeToken(env, "user", u.id, userVer(u))) });
  }
  if (p === "/api/code/send" && method === "POST") {
    if (await tooMany(env, ip)) return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
    const b = await req.json().catch(() => ({}));
    const u = byLogin(data, b.who);
    if (u) {
      await env.DB.prepare(CODES_SQL).run();
      const r = await env.DB.prepare("SELECT n, since FROM codes WHERE uid=?").bind(u.id).first();
      const fresh = !r || Date.now() - r.since > 36e5, n = fresh ? 1 : r.n + 1;
      if (n > 5) {
        await logIt(env, u.name, "Quintal \xB7 c\xF3digo bloqueado (limite por hora)", false);
      } else {
        const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1e6).padStart(6, "0");
        await env.DB.prepare("INSERT INTO codes(uid,hash,exp,tries,n,since) VALUES(?,?,?,0,?,?) ON CONFLICT(uid) DO UPDATE SET hash=excluded.hash, exp=excluded.exp, tries=0, n=excluded.n, since=excluded.since").bind(u.id, await codeHash(env, u.id, code), Date.now() + CODE_MS, n, fresh ? Date.now() : r.since).run();
        try {
          await env.EMAIL.send({ from: { email: "acesso@meucaos.com", name: "CAO(S) \xB7 Quintal" }, to: u.email, subject: `${code} \xE9 o seu c\xF3digo do CAO(S)`, html: codeMail(u, code), text: `${code} \xE9 o seu c\xF3digo para entrar no CAO(S). Vale por 10 minutos. Se n\xE3o foi voc\xEA, ignore este e-mail.` });
          await logIt(env, u.name, "Quintal \xB7 c\xF3digo enviado por e-mail", true);
        } catch (e) {
          await logIt(env, u.name, "Quintal \xB7 falha ao enviar c\xF3digo (" + String(e && (e.code || e.message) || e).slice(0, 40) + ")", false);
        }
      }
    } else await fail(env, ip);
    return json({ ok: true });
  }
  if (p === "/api/code/verify" && method === "POST") {
    if (await tooMany(env, ip)) return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
    const b = await req.json().catch(() => ({}));
    const u = byLogin(data, b.who), code = String(b.code || "").replace(/\D/g, "");
    await env.DB.prepare(CODES_SQL).run();
    const r = u && await env.DB.prepare("SELECT hash, exp, tries FROM codes WHERE uid=?").bind(u.id).first();
    if (!r || !r.hash || r.exp < Date.now() || r.tries >= 5) {
      await fail(env, ip);
      return json({ ok: false, error: "C\xF3digo vencido. Pe\xE7a um novo." }, 403);
    }
    if (code.length !== 6 || !safeEq(await codeHash(env, u.id, code), r.hash)) {
      await fail(env, ip);
      await env.DB.prepare("UPDATE codes SET tries=tries+1 WHERE uid=?").bind(u.id).run();
      await logIt(env, u.name, "Quintal \xB7 c\xF3digo incorreto", false);
      return json({ ok: false, error: r.tries + 1 >= 5 ? "C\xF3digo vencido. Pe\xE7a um novo." : "C\xF3digo incorreto" }, 403);
    }
    await env.DB.prepare("UPDATE codes SET hash='', exp=0 WHERE uid=?").bind(u.id).run();
    await logIt(env, u.name, "Quintal \xB7 entrou por c\xF3digo", true);
    return json({ ok: true, role: "user" }, 200, { "set-cookie": setCookie(await makeToken(env, "user", u.id, userVer(u))) });
  }
  if (p === "/api/open" && method === "POST") {
    const b = await req.json().catch(() => ({}));
    const panel = data.panels.find((x) => x.id === b.panelId);
    if (!panel) return json({ error: "painel" }, 404);
    if (!canOpen(s, panel)) return json({ error: "acesso" }, 403);
    await logIt(env, s.role === "admin" ? "mestre" : s.user.name, panel.name, true);
    return json({ url: panel.url });
  }
  if (!s || s.role !== "admin") return json({ error: "admin" }, 403);
  if (p === "/api/admin/elevate" && method === "POST") {
    if (await tooMany(env, ip)) return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
    const { pin } = await req.json().catch(() => ({}));
    if (!safeEq(await passHash(env, String(pin || "")), await adminHash(env))) {
      await fail(env, ip);
      await logIt(env, "mestre", "Ajustes \xB7 senha incorreta", false);
      return json({ ok: false }, 403);
    }
    return json({ ok: true, until: Date.now() + ELEV_MS }, 200, { "set-cookie": `caos_qe=${await makeElev(env)}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${ELEV_MS / 1e3}` });
  }
  if (p === "/api/admin/lock" && method === "POST") return json({ ok: true }, 200, { "set-cookie": "caos_qe=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0" });
  if (!await elevated(req, env)) return json({ error: "elevate" }, 401);
  if (p === "/api/admin/state" && method === "GET") return json({ cfg: data.cfg, panels: data.panels, users: data.users.map((u) => ({ id: u.id, name: u.name, user: u.user, teams: u.teams || [], cargo: u.cargo || "", email: u.email || "", note: u.note || "", active: u.active, access: u.access, admin: u.admin, has: !!u.pass, seen: !!u.passEnc, pass: "" })) });
  if (p === "/api/admin/reveal" && method === "POST") {
    const { id } = await req.json().catch(() => ({})), u = data.users.find((x) => x.id === id);
    if (!u) return json({ error: "usu\xE1rio" }, 404);
    await logIt(env, "mestre", "Ajustes \xB7 viu a senha de " + u.name, true);
    return json({ pass: u.passEnc ? await decPass(env, u.passEnc) : null });
  }
  if (p === "/api/admin/backup" && method === "GET") return json({ format: "caos-quintal-backup", at: Date.now(), state: { cfg: data.cfg, panels: data.panels, users: data.users } });
  if (p === "/api/admin/signout-all" && method === "POST") {
    const v = String(+await pinVer(env) + 1);
    await setMeta(env, "pinVer", v);
    await logIt(env, "mestre", "Ajustes \xB7 encerrou as outras sess\xF5es do mestre", true);
    return json({ ok: true }, 200, { "set-cookie": setCookie(await makeToken(env, "admin", "-", v)) });
  }
  if (p === "/api/admin/attempts" && method === "GET") {
    const { results } = await env.DB.prepare("SELECT ip, COUNT(*) AS n, MAX(ts) AS last FROM attempts WHERE ts > ? GROUP BY ip ORDER BY last DESC LIMIT 30").bind(Date.now() - 864e5).all();
    return json({ rows: results.map((r) => ({ ...r, ip: String(r.ip).replace(/(\d+\.\d+)\.\d+\.\d+$/, "$1.x.x").replace(/^([0-9a-f]+:[0-9a-f]+):.*$/i, "$1:\u2026") })) });
  }
  if (p === "/api/admin/state" && method === "POST") {
    const b = await req.json().catch(() => ({}));
    if (!b.cfg || !Array.isArray(b.panels) || !Array.isArray(b.users)) return json({ error: "dados" }, 400);
    const c = b.cfg, cfg = {
      title: { text: clean(c.title?.text, 80), color: COLOR(c.title?.color), size: Math.min(40, Math.max(10, +c.title?.size || 15)) },
      logo: /^data:image\//.test(c.logo || "") ? String(c.logo) : "",
      logoSize: Math.min(260, Math.max(28, +c.logoSize || 90)),
      greet: clean(c.greet, 140),
      newTab: c.newTab !== false,
      glitch: c.glitch !== false,
      layout: ["cards", "tiles", "list"].includes(c.layout) ? c.layout : "cards",
      mascot: c.mascot !== false,
      masterUser: slug(c.masterUser) || "mestre",
      mktInit: true,
      rotInit: true,
      areas: (Array.isArray(c.areas) ? c.areas : []).slice(0, 12).map((x) => ({ id: clean(x.id, 40), name: clean(x.name, 30) || "\xC1rea", theme: THEMES.includes(x.theme) ? x.theme : "base", icon: ICONS.includes(x.icon) ? x.icon : "grid", sub: clean(x.sub, 100) })).filter((x) => x.id)
    };
    if (!cfg.areas.length) cfg.areas = AREAS0.map((x) => ({ ...x }));
    const aIds = new Set(cfg.areas.map((x) => x.id));
    cfg.cats = (Array.isArray(c.cats) ? c.cats : []).slice(0, 40).map((x) => ({ id: clean(x.id, 40), name: clean(x.name, 40) || "Sem nome", area: aIds.has(x.area) ? x.area : cfg.areas[0].id })).filter((x) => x.id);
    if (!cfg.cats.length) cfg.cats = [{ id: "c_pain", name: "Pain\xE9is", area: cfg.areas[0].id }];
    if (cfg.logo.length > 9e5) return json({ error: "logo grande demais" }, 413);
    const slugs = /* @__PURE__ */ new Set(), panels = [];
    for (const x of b.panels.slice(0, 120)) {
      const old = data.panels.find((o2) => o2.id === x.id), o = { id: clean(x.id, 40), name: clean(x.name, 60), url: /^https?:\/\//i.test(x.url || "") ? clean(x.url, 500) : "", desc: clean(x.desc, 140), color: COLOR(x.color), icon: clean(x.icon, 4), key: old?.key || "", cat: clean(x.cat, 40) };
      if (x.kind === "rotina") {
        o.kind = "rotina";
        o.owner = clean(x.owner, 40);
        o.ownerRole = x.ownerRole === "view" ? "view" : "admin";
        const sl = old?.slug || (old ? "" : String(x.slug || "").toLowerCase());
        if (sl) {
          if (!SLUG_RE.test(sl) || slugs.has(sl) || ["api", "www", "icon"].includes(sl)) return json({ error: `endere\xE7o "${sl}" inv\xE1lido ou repetido` }, 400);
          slugs.add(sl);
          o.slug = sl;
          o.key = "r:" + sl;
          o.url = ROT_BASE + sl + "/";
        }
      } else if (typeof x.key === "string") o.key = KEYC(x.key);
      if (o.key && panels.some((y) => y.key === o.key)) return json({ error: `chave "${o.key}" repetida` }, 400);
      panels.push(o);
    }
    const ids = new Set(panels.filter((x) => x.kind !== "rotina").map((x) => x.id)), users = [], seenU = /* @__PURE__ */ new Set([cfg.masterUser]);
    cfg.teams = (Array.isArray(c.teams) ? c.teams : []).slice(0, 40).map((t) => ({ id: clean(t.id, 40), name: clean(t.name, 40) || "Equipe", color: COLOR(t.color), access: Object.fromEntries(Object.entries(t.access || {}).filter(([k, v]) => ids.has(k) && LV[v]).map(([k, v]) => [k, v])) })).filter((t) => t.id);
    const tIds = new Set(cfg.teams.map((t) => t.id));
    for (const x of b.users.slice(0, 200)) {
      const old = data.users.find((o) => o.id === x.id);
      let pass = old?.pass || "", passEnc = old?.passEnc || "";
      if (x.newPass) {
        if (String(x.newPass).length < 4) return json({ error: "senha curta" }, 400);
        pass = await passHash(env, String(x.newPass));
        passEnc = await encPass(env, String(x.newPass));
      } else if (!old && typeof x.pass === "string" && x.pass.length > 20) {
        pass = x.pass;
        passEnc = typeof x.passEnc === "string" ? x.passEnc : "";
      }
      let un = slug(x.user) || slug(x.name) || clean(x.id, 20);
      if (seenU.has(un)) return json({ error: `username "${un}" repetido` }, 400);
      seenU.add(un);
      const email = clean(x.email, 80).trim().toLowerCase();
      if (EMAIL_RE.test(email) && users.some((y) => y.email === email)) return json({ error: `e-mail "${email}" repetido` }, 400);
      const access = (x.access || []).filter((id) => ids.has(id));
      users.push({ id: clean(x.id, 40), name: clean(x.name, 40), user: un, teams: (Array.isArray(x.teams) ? x.teams : []).filter((t) => tIds.has(t)), cargo: clean(x.cargo, 50), email, note: clean(x.note, 200), pass, passEnc, active: x.active !== false, access, admin: (x.admin || []).filter((id) => access.includes(id)) });
    }
    for (const x of panels) if (!cfg.cats.some((c2) => c2.id === x.cat)) x.cat = cfg.cats[0].id;
    await env.DB.batch([putKV(env, "cfg", cfg), putKV(env, "panels", panels), putKV(env, "users", users)]);
    const last = await env.DB.prepare("SELECT t FROM log WHERE user='mestre' AND panel='Ajustes \xB7 altera\xE7\xF5es salvas' ORDER BY id DESC LIMIT 1").first();
    if (!last || Date.now() - last.t > 5 * 6e4) await logIt(env, "mestre", "Ajustes \xB7 altera\xE7\xF5es salvas", true);
    return json({ ok: true, users: users.map((u) => ({ id: u.id, user: u.user, has: !!u.pass, seen: !!u.passEnc })) });
  }
  if (p === "/api/admin/log" && method === "GET") {
    const { results } = await env.DB.prepare("SELECT t, user, panel, ok FROM log ORDER BY id DESC LIMIT 300").all();
    return json({ log: results });
  }
  if (p === "/api/admin/log" && method === "DELETE") {
    await env.DB.prepare("DELETE FROM log").run();
    return json({ ok: true });
  }
  if (p === "/api/admin/pin" && method === "POST") {
    const { pin } = await req.json().catch(() => ({}));
    if (String(pin || "").length < 4) return json({ error: "senha curta" }, 400);
    await setMeta(env, "adminHash", await passHash(env, String(pin)));
    const v = String(+await pinVer(env) + 1);
    await setMeta(env, "pinVer", v);
    return json({ ok: true }, 200, { "set-cookie": setCookie(await makeToken(env, "admin", "-", v)) });
  }
  if (p === "/api/admin/backup-now" && method === "POST") return json({ day: await snapshot(env) });
  return json({ error: "not found" }, 404);
}
__name(api, "api");
var SEC = { "x-frame-options": "DENY", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "cache-control": "no-cache" };
var index_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    DOM = url.hostname.endsWith("meucaos.com") ? "; Domain=meucaos.com" : "";
    if (url.hostname === "www.meucaos.com") return Response.redirect("https://meucaos.com" + url.pathname + url.search, 301);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await api(req, env, url);
      } catch (e) {
        return json({ error: String(e && e.message || e) }, 500);
      }
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
var Quintal = class extends WorkerEntrypoint {
  static {
    __name(this, "Quintal");
  }
  async check(cookie, key, doLog) {
    const env = this.env, data = await loadAll(env);
    CFG = data.cfg;
    const s = await sessionFrom(cookie || "", env, data);
    if (!s) return { role: null, reason: "login", glitch: data.cfg.glitch !== false };
    const panel = data.panels.find((x) => x.key && x.key === key);
    const name = s.role === "admin" ? "admin" : s.user.name, glitch = data.cfg.glitch !== false;
    const role = s.role === "admin" ? "admin" : roleIn(s, panel);
    if (!role) return { role: null, reason: "acesso", name, glitch };
    if (doLog && panel) {
      const last = await env.DB.prepare("SELECT t FROM log WHERE user=? AND panel=? AND ok=1 ORDER BY id DESC LIMIT 1").bind(name, panel.name).first();
      if (!last || Date.now() - last.t > 12e4) await logIt(env, name, panel.name, true);
    }
    return { role, name, glitch };
  }
  /* serviço das rotinas pessoais (rotina.meucaos.com/<endereço>/) */
  async board(sl) {
    const data = await loadAll(this.env), p = data.panels.find((x) => x.kind === "rotina" && x.slug === sl);
    if (!p) return { exists: false };
    const u = data.users.find((x) => x.id === p.owner);
    return { exists: true, title: u ? u.name.trim().split(/\s+/)[0] : p.name, name: p.name };
  }
  async boards() {
    const data = await loadAll(this.env);
    return data.panels.filter((x) => x.kind === "rotina" && x.slug).map((x) => x.slug);
  }
};
export {
  Quintal,
  index_default as default
};
//# sourceMappingURL=index.js.map
