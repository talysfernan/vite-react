# Plano Omnichannel

Painel de apresentação do plano de ação de cada marca, em https://plano.meucaos.com
(worker `caos-plano`). BR e US no mesmo painel (bandeiras no canto), cada país com
seu Durable Object (`br`/`us`) e sua chave no Quintal (`plano-br`/`plano-us`).

- Mapa por marca: Marca → Estrela-guia → Departamentos → Setores → Estratégias → Etapas.
- Modo Apresentação: tela cheia, passa card a card com zoom (setas do teclado, Esc sai).
- `public/index.html` é o app inteiro; `site.js` serve a página, o manifest, o sw.js e os
  ícones embutidos no código (sem assets, porque o upload de assets pelo proxy falha).
- `worker.js` = API doc-store + Durable Object `Store` (adaptado da Constelação).
- Deploy: `cd plano && CLOUDFLARE_API_TOKEN=proxy npx -y wrangler@4.40.0 deploy`
- Cópia de teste: `python3 plano/preview.py <saída.html>` (API simulada no navegador).
