# Lousa

Canvas infinito do CAO(S) em https://lousa.meucaos.com (worker `caos-lousa`, chave `lousa` no Quintal,
área/categoria **Ferramentas**).

- `public/index.html` — o app inteiro (caneta com pressão, mouse, toque; borracha, texto, seleção, zoom).
- `worker.js` — API doc-store (`s/` traços, `t/` textos) num Durable Object com SQLite; foto diária por alarme.
- `site.js` — entrada: serve o HTML, ícones, manifest e sw.js embutidos no código (sem assets).

Deploy: `cd lousa && CLOUDFLARE_API_TOKEN=proxy npx -y wrangler@4.40.0 deploy`.
Teste local: `.dev.vars` com `SESSION_SECRET=...` e `npx wrangler dev` (entra pela senha de emergência).
