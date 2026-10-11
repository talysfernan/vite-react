# Monta dist/index.html: HTML + design system (base.css) + app.js + logos (simple-icons)
import pathlib
root = pathlib.Path(__file__).parent / 'src'
si = (root / 'si.json').read_text()
js = (root / 'app.js').read_text().replace('/*SI*/{}', si, 1)
html = (root / 'index.src.html').read_text().replace('/*BASE*/', (root / 'base.css').read_text(), 1).replace('/*JS*/', js, 1)
out = root.parent / 'dist'; out.mkdir(exist_ok=True)
(out / 'index.html').write_text(html)
print('dist/index.html', len(html), 'bytes')
