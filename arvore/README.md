# Árvore de Sustentabilidade (caos-arvore)

Cópia do que está no ar em arvore.meucaos.com (baixada do Cloudflare em 14/10/2026).
- `worker.js` = worker original; `site.js` = entrada que serve o `index.html` embutido; rota `/api/ajustes` lê os Ajustes Globais (binding `AJUSTES`). Reexporta o entrypoint `Tick`.
- Tarifas dos canais, tabelas Mercado Envios/FBA e logística vêm dos Ajustes Globais (só leitura); sem eles, volta para os valores salvos na marca.
- Publicação: `python3 arvore/deploy.py` (mantém assets, D1, segredos e Quintal; acrescenta `AJUSTES`).
- As tarifas usam a marca de cada produto; logística, frete médio e devoluções de cada conta vêm do perfil que atende aquele canal (“Canais que usam” nos Ajustes Globais).
