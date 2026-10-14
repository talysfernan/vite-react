# Análise semanal (painel-semanal)

Cópia do que está no ar em analise-semanal.meucaos.com (baixada do Cloudflare em 14/10/2026).
- `worker.js` = worker original; `site.js` = entrada que serve o `index.html` embutido; rota `/api/ajustes` lê os Ajustes Globais (binding `AJUSTES`).
- Tarifas dos canais, tabelas Mercado Envios/FBA e logística vêm dos Ajustes Globais (só leitura); sem eles, volta para os valores salvos na marca.
- Publicação: `python3 semanal/deploy.py` (mantém assets, D1, segredos e Quintal; acrescenta `AJUSTES`).
