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
  const KEY = 'constelacao-teste-docs4';
  const nowBR = new Date(Date.now() - 3 * 3600e3), m = nowBR.toISOString().slice(0, 7), td = nowBR.getUTCDate(), d = n => new Date(nowBR.getTime() + n * 864e5).toISOString().slice(0, 10);
  const base = { month: m, brands: [], who: [], links: [], t: 1 };
  const tk = (t, st, who, due, x) => ({ id: Math.random().toString(36).slice(2, 9), t, st: st || 'todo', who: who || '', due: due || '', ...(x || {}) });
  const SEED = {
    'marca/yu': { name: 'Yucaloo', color: '#60a5fa', t: 1 }, 'marca/cl': { name: 'Coco & Luna', color: '#f472b6', t: 2 }, 'marca/ml': { name: 'Mercado Livre', color: '#facc15', t: 3 },
    'pessoa/p1': { name: 'Talys', color: '#4ade80' }, 'pessoa/p2': { name: 'Charles', color: '#facc15' }, 'pessoa/p3': { name: 'Bia', color: '#f472b6' },
    'node/d1': { ...base, mk: 'yu', cat: 'dia', day: Math.max(1, td - 3), title: '', x: 220, y: 0, parent: null },
    'node/d2': { ...base, mk: 'yu', cat: 'dia', day: td, title: 'lançamento', x: 900, y: 0, parent: null },
    'node/d3': { ...base, mk: 'yu', cat: 'dia', day: Math.min(28, td + 6), title: '', x: 1600, y: 0, parent: null },
    'node/m1': { ...base, mk: 'yu', cat: 'marco', title: 'Black Friday', nivel: 'crit', modelo: 'lista', x: 420, y: -210, parent: 'd1', who: ['p1'], tasks: [tk('Definir oferta e cupom', 'done', 'p1', d(-2)), tk('Briefing para a agência', 'done', 'p1', d(-1)), tk('Artes do feed e stories', 'doing', 'p3', d(1)), tk('Subir campanha no Meta Ads', 'todo', 'p2', d(2)), tk('Revisar estoque FBA', 'blocked', 'p2', d(-1)), tk('E-mail para a base', 'todo', '', d(4))] },
    'node/m2': { ...base, mk: 'yu', cat: 'marco', title: 'Reels da areia', nivel: 'imp', modelo: 'quadro', x: 780, y: -330, parent: 'm1', tasks: [tk('Roteiro', 'done', 'p3'), tk('Gravação', 'doing', 'p3', d(1)), tk('Edição', 'todo', 'p2', d(3))] },
    'node/m3': { ...base, mk: 'yu', cat: 'marco', title: 'Calendário de posts', nivel: 'imp', modelo: 'conteudo', x: 1120, y: -170, parent: 'd2', tasks: [tk('Antes e depois da caixa', 'review', 'p3', d(1), { fmt: 'Reels', canal: 'c1' }), tk('Carrossel: 5 motivos', 'todo', 'p3', d(3), { fmt: 'Carrossel', canal: 'c1' }), tk('Live de lançamento', 'todo', 'p1', d(5), { fmt: 'Live', canal: 'c2' })] },
    'node/m4': { ...base, mk: 'yu', cat: 'marco', title: 'Reunião com a agência', nivel: 'leve', modelo: 'pauta', x: 1120, y: 200, parent: 'd2', meet: { date: d(1), time: '10:00', where: 'Meet' }, tasks: [tk('Resultados da semana', 'todo', '', '', { kind: 'topico', dec: 'Dobrar verba no criativo 2' }), tk('Pauta de influenciadoras', 'todo', '', '', { kind: 'topico' })] },
    'node/m5': { ...base, mk: 'yu', cat: 'marco', title: 'Lançamento Ômega', nivel: 'imp', modelo: 'etapas', x: 1820, y: -200, parent: 'd3', tasks: [tk('Amostras', 'done', 'p2', d(-6), { start: d(-9) }), tk('Embalagem', 'doing', 'p3', d(4), { start: d(-2) }), tk('Fotos', 'todo', 'p3', d(8), { start: d(5) })] },
    'node/c1': { ...base, mk: 'yu', cat: 'canal', bi: 'r_cam', title: 'Instagram', x: 520, y: 230, parent: 'd1' },
    'node/c2': { ...base, mk: 'yu', cat: 'canal', bi: 'r_note', title: 'TikTok', x: 760, y: 300, parent: 'c1' },
    'node/k1': { ...base, mk: 'yu', cat: 'comentario', title: 'Lembrar: o teaser só sai depois da arte aprovada.', color: '#facc15', x: 1560, y: 260, parent: 'm4', w: 240 },
    'node/q1': { ...base, mk: 'cl', cat: 'dia', day: td, x: 300, y: 0, parent: null },
    'node/q2': { ...base, mk: 'cl', cat: 'marco', title: 'Kit presente', nivel: 'imp', x: 560, y: -180, parent: 'q1', tasks: [tk('Fornecedor da caixa', 'todo', 'p2', d(2))] }
  };
  let all; try { all = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) {}
  if (!all) all = { br: JSON.parse(JSON.stringify(SEED)), us: { 'marca/yu': { name: 'Yucaloo', color: '#60a5fa', t: 1 }, 'node/u0': { ...base, mk: 'yu', cat: 'dia', day: 1, x: 300, y: 0, parent: null }, 'node/u1': { ...base, mk: 'yu', cat: 'marco', nivel: 'imp', title: 'Plano USA', x: 520, y: -200, parent: 'u0', tasks: [] } } };
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
