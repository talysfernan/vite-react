# Análise mensal (painel-caos)

Cópia do que está no ar em analise-mensal.meucaos.com (baixada do Cloudflare em 14/10/2026).
- `site.js` = worker já empacotado + entrada que serve o `index.html` embutido; rota `/api/ajustes` lê os Ajustes Globais (binding `AJUSTES`). Exporta o entrypoint `Sums` (usado pelo DRE).
- Tarifas dos canais, tabelas Mercado Envios/FBA e logística vêm dos Ajustes Globais (só leitura); sem eles, volta para os valores salvos na marca.
- Publicação: `python3 mensal/deploy.py` (mantém assets, D1, segredos e Quintal; acrescenta `AJUSTES`).
