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
  const KEY = 'constelacao-teste-docs3';
  const nowBR = new Date(Date.now() - 3 * 3600e3), m = nowBR.toISOString().slice(0, 7), d = n => new Date(nowBR.getTime() + n * 864e5).toISOString().slice(0, 10);
  const base = { month: m, status: 'todo', prio: 'm', brands: [], team: '', who: [], f: {}, chk: [], anc: [], links: [], t: 1 };
  const SEED = {
    'marca/yu': { name: 'Yucaloo', color: '#60a5fa', t: 1 }, 'marca/cl': { name: 'Coco & Luna', color: '#f472b6', t: 2 }, 'app/seeded': { t: 1 },
    'pessoa/p1': { name: 'Talys', color: '#4ade80' }, 'pessoa/p2': { name: 'Charles', color: '#facc15' },
    'node/y0': { ...base, mk: 'yu', cat: 'ponto', title: '', x: 300, y: 0, parent: null },
    'node/y1': { ...base, mk: 'yu', cat: 'plano', title: 'Black Friday', x: 420, y: -230, parent: 'y0', status: 'doing', who: ['p1'] },
    'node/y2': { ...base, mk: 'yu', cat: 'roteiro', title: 'Roteiro do reels', x: 700, y: -320, parent: 'y1', due: d(1), who: ['p2'] },
    'node/y3': { ...base, mk: 'yu', cat: 'acao', title: 'Gravar vídeo', x: 960, y: -320, parent: 'y2', due: d(3) },
    'node/y4': { ...base, mk: 'yu', cat: 'acao', title: 'Aprovar arte', x: 700, y: -170, parent: 'y1', status: 'done' },
    'node/y5': { ...base, mk: 'yu', cat: 'anuncio', title: 'Meta Ads', x: 960, y: -170, parent: 'y4', due: d(-1) },
    'node/y6': { ...base, mk: 'yu', cat: 'canal', title: '', f: { rede: 'Instagram' }, x: 760, y: 200, parent: 'y0' },
    'node/y7': { ...base, mk: 'yu', cat: 'acao', title: 'Postar teaser', x: 1000, y: 200, parent: 'y6', status: 'blocked' },
    'node/y8': { ...base, mk: 'yu', cat: 'comentario', title: 'Lembrar: o teaser só sai depois da arte aprovada.', x: 1060, y: 330, parent: 'y7', w: 240 },
    'node/y9': { ...base, mk: 'yu', cat: 'ponto', title: 'Meio do mês', x: 1500, y: 0, parent: 'y0' },
    'node/c0': { ...base, mk: 'cl', cat: 'ponto', title: '', x: 300, y: 0, parent: null },
    'node/c1': { ...base, mk: 'cl', cat: 'lancamento', title: 'Lançamento Ômega', x: 520, y: -200, parent: 'c0', color: '#f472b6' },
    'node/c2': { ...base, mk: 'cl', cat: 'acao', title: 'Fotos do produto', x: 800, y: -200, parent: 'c1', due: d(2) }
  };
  let all; try { all = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) {}
  if (!all) all = { br: JSON.parse(JSON.stringify(SEED)), us: { 'marca/yu': { name: 'Yucaloo', color: '#60a5fa', t: 1 }, 'app/seeded': { t: 1 }, 'node/u0': { ...base, mk: 'yu', cat: 'ponto', title: '', x: 300, y: 0, parent: null }, 'node/u1': { ...base, mk: 'yu', cat: 'plano', title: 'Plano USA', x: 520, y: -200, parent: 'u0' } } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) {} };
  window.__resetTeste = () => { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); };
  const res = (o, s = 200) => Promise.resolve(new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } }));
  window.fetch = (url, opt = {}) => {
    const p = String(url).split('?')[0], b = (opt.headers || {})['x-board'] === 'us' ? 'us' : 'br', docs = all[b];
    if (p === '/api/session') return res({ role: 'admin', name: 'Teste', board: b });
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
