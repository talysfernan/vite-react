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
  const KEY = 'nossavet-teste-docs1';
  const d = new Date(), iso = x => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const wk = iso(mon), plus = n => { const x = new Date(mon); x.setDate(x.getDate() + n); return iso(x); };
  const SEED = {
    'app/cfg': { start: wk, days: [0, 2, 4], leadRot: 3, leadApr: 2, logoSize: 30 },
    'prod/p1': { name: 'Areia de Mandioca', marca: 'Yucaloo', color: '#0bde86', resumo: 'Areia biodegradável feita de mandioca: aglomera rápido e controla o odor sem poeira.', ben: ['Controla o odor por mais tempo', 'Zero poeira, respiração mais saudável', 'Aglomera rápido e é fácil de limpar', 'Biodegradável, pode ir no vaso'], car: ['100% mandioca', 'Pacote de 2 kg'], t: 1 },
    'prod/p2': { name: 'Suplemento Articular', marca: 'Coco & Luna', color: '#a78bfa', resumo: 'Suplemento para articulações de cães e gatos idosos.', ben: ['Mais mobilidade', 'Menos dor ao levantar', 'Cartilagem protegida', 'Petisco palatável'], car: ['Colágeno tipo II'], t: 2 },
    'item/i1': { title: 'Por que a caixa de areia cheira mesmo limpa?', stage: 'roteiro', wk, slot: 0, date: plus(0), dRot: plus(-3), dApr: plus(-2), pilar: 'hig', esp: 'gato', dor: 'Tutor de apartamento que limpa a caixa todo dia e ainda sente cheiro', prods: [{ id: 'p1', lig: 'dir' }], formato: 'curto', redes: ['ig', 'tt'], brief: 'Explicar amônia e bactérias, sem citar marca.', chk: {}, files: [], links: [], hist: [{ t: Date.now() - 864e5, by: 'Marketing', a: 'criou' }], t: 1 },
    'item/i2': { title: 'Sinais de que seu pet idoso sente dor', stage: 'aprovacao', wk, slot: 1, date: plus(2), dRot: plus(-1), dApr: plus(0), pilar: 'saude', esp: 'ambos', dor: 'Tutor de pet idoso que acha que é "só a idade"', prods: [{ id: 'p2', lig: 'dir' }], formato: 'carrossel', redes: ['ig'], gancho: 'Seu pet demora para levantar? Não é só a idade.', roteiro: 'Slide 1…', chk: { marca: true, emb: true, nome: true, etica: true }, rq: { id: 'r1', t: Date.now() - 36e5, by: 'Conteúdo', status: 'pending' }, files: [], links: [], hist: [{ t: Date.now() - 36e5, by: 'Conteúdo', a: 'enviou' }], t: 2 },
    'item/b1': { title: 'Quantas caixas de areia ter com 2 gatos?', stage: 'tema', wk: '', slot: null, pilar: 'manejo', esp: 'gato', prods: [{ id: 'p1', lig: 'ctx' }], redes: [], chk: {}, files: [], links: [], hist: [], t: 3 }
  };
  let all; try { all = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) {}
  if (!all) all = { br: JSON.parse(JSON.stringify(SEED)), us: { 'app/cfg': SEED['app/cfg'] } };
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
    if (p === '/api/files' && opt.method === 'POST') return res({ id: Math.random().toString(16).slice(2, 22).padEnd(20, '0'), name: decodeURIComponent((opt.headers || {})['x-name'] || 'arquivo'), size: opt.body?.size || 0, type: (opt.headers || {})['content-type'] || '' });
    if (p === '/api/backups') return res({ backups: [] });
    return res({ ok: true });
  };
})();
</script>
<style>
.teste-bar{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:10px;padding:6px 6px 6px 14px;border-radius:999px;background:#facc15;color:#1a1500;font:600 12.5px/1.2 system-ui,sans-serif;box-shadow:0 8px 24px -8px rgba(0,0,0,.7);max-width:calc(100vw - 32px)}
.teste-bar button{border:0;border-radius:999px;padding:6px 12px;background:#1a1500;color:#facc15;font:inherit;cursor:pointer}
</style>"""
BAR = '<div class="teste-bar">Modo teste · dados de exemplo, nada é salvo no painel real<button type="button" onclick="__resetTeste()">Recomeçar</button></div>'

html = re.sub(r'^<!doctype html>\s*<html[^>]*><head>', '', html, flags=re.I)
html = html.replace('<title>nossavet</title>', '<title>nossavet · Teste</title>', 1)
html = re.sub(r'<link rel="(icon|apple-touch-icon|manifest)"[^>]*>', '', html)
html = html.replace('</style></head><body>', '</style>' + MOCK + BAR, 1)
html = re.sub(r'</body></html>\s*$', '', html)
html = html[html.index('<title>'):html.index('</title>') + 8] + html.replace('<title>nossavet · Teste</title>', '', 1)
out.write_text(html)
print(out, len(html), 'bytes')
