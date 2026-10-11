# Junta o HTML com a biblioteca de logos (simple-icons) e gera dist/index.html
import json, pathlib
root = pathlib.Path(__file__).parent
si = (root / 'src' / 'si.json').read_text()
html = (root / 'src' / 'index.src.html').read_text().replace('/*SI*/{}', si, 1)
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist' / 'index.html').write_text(html)
print('dist/index.html', len(html), 'bytes')
