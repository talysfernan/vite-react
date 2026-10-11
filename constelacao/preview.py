# Gera uma cópia de teste do painel (sem servidor): a API é simulada no próprio navegador,
# com dados de exemplo guardados só no navegador de quem testa. Nada chega aos dados reais.
# Uso: python3 preview.py [saida.html]
import pathlib, re, sys
root = pathlib.Path(__file__).parent
html = (root / 'public' / 'index.html').read_text()
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'preview.html'

MOCK = r"""<script>
/* ===== MODO TESTE: API simulada no navegador (nada vai para o servidor) ===== */
(() => {
  const KEY = 'constelacao-teste-docs';
  const nowBR = new Date(Date.now() - 3 * 3600e3), m = nowBR.toISOString().slice(0, 7);
  const base = { month: m, status: 'todo', prio: 'm', brands: [], team: '', who: [], f: {}, chk: [], anc: [], links: [], t: 1 };
  const SEED = {
    'node/ex0': { ...base, cat: 'ponto', title: '', x: 300, y: 0, parent: null },
    'node/ex1': { ...base, cat: 'roteiro', title: 'Roteiro', x: 420, y: -280, parent: 'ex0', ln: 'curva' },
    'node/ex2': { ...base, cat: 'plano', title: 'Plano', x: 650, y: -430, parent: 'ex1' },
    'node/ex3': { ...base, cat: 'acao', title: 'Ação de exemplo', x: 900, y: 160, parent: 'ex0' }
  };
  let docs; try { docs = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) {}
  if (!docs) docs = JSON.parse(JSON.stringify(SEED));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(docs)); } catch (e) {} };
  window.__resetTeste = () => { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); };
  const res = (o, s = 200) => Promise.resolve(new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } }));
  window.fetch = (url, opt = {}) => {
    const p = String(url).split('?')[0];
    if (p === '/api/session') return res({ role: 'admin', name: 'Teste', board: 'br' });
    if (p === '/api/ver') return res({ v: 'teste' });
    if (p === '/api/docs' && (opt.method || 'GET') === 'GET') return res({ docs, now: Date.now() });
    if (p === '/api/changes') return res({ docs: {}, now: Date.now() });
    if (p === '/api/docs') { for (const o of JSON.parse(opt.body || '{}').ops || []) { if (o.body === null) delete docs[o.path]; else docs[o.path] = o.body; } save(); return res({ ok: true, now: Date.now() }); }
    if (p === '/api/backups') return res({ backups: [] });
    return res({ ok: true });
  };
})();
</script>
<style>
.teste-bar{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:10px;padding:6px 6px 6px 14px;border-radius:999px;background:#facc15;color:#1a1500;font:600 12.5px/1.2 system-ui,sans-serif;box-shadow:0 8px 24px -8px rgba(0,0,0,.7);max-width:calc(100vw - 32px)}
.teste-bar button{border:0;border-radius:999px;padding:6px 12px;background:#1a1500;color:#facc15;font:inherit;cursor:pointer}
.teste-bar button:focus-visible{outline:2px solid #1a1500;outline-offset:2px}
</style>"""
BAR = '<div class="teste-bar">Modo teste · dados de exemplo, nada é salvo no painel real<button type="button" onclick="__resetTeste()">Recomeçar</button></div>'

html = re.sub(r'^<!doctype html>\s*<html[^>]*><head>', '', html, flags=re.I)
html = html.replace('<title>Constelação</title>', '<title>Constelação · Teste</title>', 1)
html = re.sub(r'<link rel="(icon|apple-touch-icon|manifest)"[^>]*>', '', html)
html = html.replace('</style></head><body>', '</style>' + MOCK + BAR, 1)
html = re.sub(r'</body></html>\s*$', '', html)
# o título precisa estar nos primeiros 8KB
html = html[html.index('<title>'):html.index('</title>') + 8] + html.replace('<title>Constelação · Teste</title>', '', 1)
out.write_text(html)
print(out, len(html), 'bytes')
