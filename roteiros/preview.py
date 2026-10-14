# Gera uma cópia de teste do painel (sem servidor): a API é simulada no próprio navegador,
# com dados de exemplo guardados só no navegador de quem testa. Nada chega aos dados reais.
# Uso: python3 preview.py [saida.html]
import pathlib, re, sys
root = pathlib.Path(__file__).parent
html = (root / 'static' / 'index.html').read_text()
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'preview.html'

MOCK = r"""<script>
/* ===== MODO TESTE: API simulada no navegador (nada vai para o servidor) ===== */
(() => {
  const KEY = 'roteiros-teste-docs1';
  const SEED = {
    'fluxo/ex1': { t: 'Frente A · primeiro contato', f: 'A', n: 1, steps: [
      { w: 'p', x: 'Oii! Vi o comentário de vocês, como funciona?' },
      { w: 'm', x: 'Oiii! Que bom que você chamou 💚 A gente amou o perfil de vocês! Queremos mandar um produto nosso de presente pra vocês testarem e mostrarem como foi. O frete é por nossa conta!' },
      { w: 'm', x: 'Me conta: vocês são de qual cidade? E qual o nome do pet?' } ] },
    'fluxo/ex2': { t: 'Frente B · convite', f: 'B', n: 2, steps: [ { w: 'm', x: 'Queremos te convidar pra uma experiência de compra e uso: você compra pelo link, manda o comprovante e a gente reembolsa produto + frete na hora 🫶' } ] }
  };
  let docs; try { docs = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) {}
  if (!docs) docs = JSON.parse(JSON.stringify(SEED));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(docs)); } catch (e) {} };
  window.__resetTeste = () => { try { localStorage.removeItem(KEY); localStorage.removeItem('rot:usadas'); } catch (e) {} location.reload(); };
  const res = (o, s = 200) => Promise.resolve(new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } }));
  window.fetch = (url, opt = {}) => {
    const p = String(url).split('?')[0];
    if (p === '/api/session') return res({ role: new URLSearchParams(location.search).get('papel') === 'uso' ? 'view' : 'admin', name: 'Teste' });
    if (p === '/api/ver') return res({ v: 'teste' });
    if (p === '/api/docs' && (opt.method || 'GET') === 'GET') return res({ docs, now: Date.now() });
    if (p === '/api/changes') return res({ docs: {}, now: Date.now() });
    if (p === '/api/docs') { for (const o of JSON.parse(opt.body || '{}').ops || []) { if (o.body === null) delete docs[o.path]; else docs[o.path] = o.body; } save(); return res({ ok: true, now: Date.now() }); }
    return res({ ok: true });
  };
})();
</script>
<style>
.teste-bar{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:10px;padding:6px 6px 6px 14px;border-radius:999px;background:#facc15;color:#1a1500;font:600 12.5px/1.2 system-ui,sans-serif;box-shadow:0 8px 24px -8px rgba(0,0,0,.7);max-width:calc(100vw - 32px)}
.teste-bar button{border:0;border-radius:999px;padding:6px 12px;background:#1a1500;color:#facc15;font:inherit;cursor:pointer}
@media print{.teste-bar{display:none}}
</style>"""
BAR = '<div class="teste-bar">Modo teste · nada é salvo no painel real<button type="button" onclick="__resetTeste()">Recomeçar</button></div>'

html = re.sub(r'^<!doctype html>\s*<html[^>]*><head>', '', html, flags=re.I)
html = html.replace('<title>Roteiros</title>', '<title>Roteiros · Teste</title>', 1)
html = re.sub(r'<link rel="(icon|apple-touch-icon|manifest)"[^>]*>', '', html)
html = html.replace('</style></head><body>', '</style>' + MOCK + BAR, 1)
html = re.sub(r'</body></html>\s*$', '', html)
html = html[html.index('<title>'):html.index('</title>') + 8] + html.replace('<title>Roteiros · Teste</title>', '', 1)
out.write_text(html)
print(out, len(html), 'bytes')
