# Publica site.js + index.js + index.html no worker caos-parceiros, mantendo assets e bindings do que está no ar.
import json, os, subprocess, sys
A = '7555b9666c694118eaab1e89c150e74b'
d = os.path.dirname(os.path.abspath(__file__))
meta = {
  'main_module': 'site.js', 'compatibility_date': '2025-09-01',
  'keep_assets': True, 'assets': {'config': {'run_worker_first': True}},
  'keep_bindings': ['secret_text', 'd1', 'service', 'version_metadata', 'assets'],
  'bindings': [{'type': 'd1', 'name': 'DB_US', 'id': '0eec82b2-4178-487d-8168-2f3e6bbd23da'}],  # banco dos EUA (DB = Brasil)
}
mp = os.path.join(d, '.meta.json'); open(mp, 'w').write(json.dumps(meta))
r = subprocess.run(['curl', '-sS', '-X', 'PUT', f'https://api.cloudflare.com/client/v4/accounts/{A}/workers/scripts/caos-parceiros',
  '-F', f'metadata=@{mp};type=application/json',
  '-F', f'site.js=@{d}/site.js;filename=site.js;type=application/javascript+module',
  '-F', f'index.js=@{d}/index.js;filename=index.js;type=application/javascript+module',
  '-F', f'index.html=@{d}/index.html;filename=index.html;type=text/plain'], capture_output=True, text=True)
os.remove(mp)
o = json.loads(r.stdout or '{}'); print(json.dumps({'success': o.get('success'), 'errors': o.get('errors')}))
sys.exit(0 if o.get('success') else 1)
