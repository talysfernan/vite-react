# Gera a versão offline do painel (abre com dois cliques, sem servidor nem login):
# API simulada no navegador, dados salvos só no localStorage de quem abre. Anexos não funcionam.
# Uso: python3 offline.py [saida.html]
import pathlib, re, sys
root = pathlib.Path(__file__).parent
html = (root / "public" / "index.html").read_text()
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "constelacao-offline.html"
MOCK = r"""<script>
/* ===== OFFLINE: API simulada no navegador, dados guardados neste navegador ===== */
(() => {
  const KEY = 'constelacao-offline';
  const m = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 7);
  const base = { month: m, status: 'todo', prio: 'm', brands: [], team: '', who: [], f: {}, chk: [], anc: [], links: [], t: 1 };
  let all; try { all = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) {}
  if (!all) all = { br: { 'node/r0': { ...base, cat: 'ponto', title: '', x: 300, y: 0, parent: null } }, us: { 'node/u0': { ...base, cat: 'ponto', title: '', x: 300, y: 0, parent: null } } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) {} };
  const res = (o, s = 200) => Promise.resolve(new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } }));
  window.fetch = (url, opt = {}) => {
    const p = String(url).split('?')[0], b = (opt.headers || {})['x-board'] === 'us' ? 'us' : 'br', docs = all[b];
    if (p === '/api/session') return res({ role: 'admin', name: 'Talys', board: b });
    if (p === '/api/ver') return res({ v: 'offline' });
    if (p === '/api/docs' && (opt.method || 'GET') === 'GET') return res({ docs, now: Date.now() });
    if (p === '/api/changes') return res({ docs: {}, now: Date.now() });
    if (p === '/api/docs') { for (const o of JSON.parse(opt.body || '{}').ops || []) { if (o.body === null) delete docs[o.path]; else docs[o.path] = o.body; } save(); return res({ ok: true, now: Date.now() }); }
    if (p === '/api/backups') return res({ backups: [] });
    return res({ ok: true });
  };
})();
</script>"""
html = re.sub(r'<link rel="(icon|apple-touch-icon|manifest)"[^>]*>', '', html)
assert '</style></head><body>' in html
html = html.replace('</style></head><body>', '</style>' + MOCK + '</head><body>', 1)
out.write_text(html)
print(out, len(html), "bytes")
