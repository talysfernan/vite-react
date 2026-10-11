# nossavet

Painel da semana de conteúdos do canal nossavet (https://nossavet.meucaos.com), worker `caos-nossavet`.

- BR e US no mesmo endereço, bandeiras no canto. Cada país tem seus dados (Durable Object `br`/`us`) e sua chave no Quintal (`nossavet-br`/`nossavet-us`). País: cabeçalho `x-board` → cookie `nv_b`; `?pais=br|us` escolhe ao abrir.
- `worker.js` = worker + Durable Object `Store` + entrypoints `Tick` (foto diária, chamado pela Rotina) e `Inbox` (caixa de Pedidos da Rotina: conteúdos em aprovação). Tudo vai embutido no código (HTML, ícones, manifest, sw), sem assets.
- `public/index.html` = o app inteiro. Dados: `app/cfg`, `prod/<id>` (produtos), `item/<id>` (conteúdos; `wk` = segunda da semana e `slot` 0–2, ou `wk` vazio = banco de temas).
- Aprovar = selo de admin do painel no Quintal. O servidor recusa aprovação vinda de quem é só "uso".
- Rotina (`caos-rotina`) tem os bindings `INBOX_NOSSAVET` e `COLAB_NOSSAVET` apontando para cá.
- Deploy: `cd nossavet && CLOUDFLARE_API_TOKEN=proxy npx -y wrangler@4.40.0 deploy`. Segredos: `SESSION_SECRET` (definido); `EXPORT_KEY` ainda não (export/backup do Drive desligado até definir).
- Cópia de teste: `python3 nossavet/preview.py <saída>`. Teste local: `.dev.vars` com `SESSION_SECRET=...` e `npx wrangler dev`, entrar com `?emergencia`.
