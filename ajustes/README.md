# Ajustes Globais

Painel `caos-ajustes` em **ajustes.meucaos.com** (Quintal: área Diretoria, chave `ajustes`).
Fonte única das tarifas de canais (Mercado Livre, ML Full, Shopee, Amazon FBA, TikTok Shop, Shopify + Mercado Pago),
das tabelas Mercado Envios e FBA e dos perfis de logística — **por marca e país**, com vigência ("desde").

- Dados: `app/brands` (marcas + apelidos usados em cada painel) e `tar/<marca>__<BR|US>` = `{ versions: [{ from, rates, logi, logiDefault }] }`.
  `rates` tem o mesmo formato do `brand.rates` do Mensal/Semanal (inclui `ml.ship` e `amazon.fba`).
- Os outros painéis só leem, pelo service binding `AJUSTES → caos-ajustes#Ajustes`:
  `get(nomeDaMarca, 'BR'|'US', 'AAAA-MM-DD'?)` → `{ brand, country, from, rates, logi }` (vigência válida na data).
- Deploy: `cd ajustes && CLOUDFLARE_API_TOKEN=proxy npx -y wrangler@4.40.0 deploy` · teste: `python3 ajustes/preview.py <saída>`.
