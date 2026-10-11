# Constelação de ações

Painel de linha do tempo mensal do CAO(S), um por país:

- 🇧🇷 https://constelacao-br.meucaos.com
- 🇺🇸 https://constelacao-us.meucaos.com

Esta pasta é uma cópia fiel da versão que está no ar no Worker `caos-constelacao`
(feita no Cowork), baixada do Cloudflare em 11/10/2026. É a base para as correções.

## Estrutura

- `public/` — arquivos estáticos servidos pelo binding `ASSETS` (o app inteiro está em `index.html`)
- `worker.js` — Worker + Durable Object `Store` (código como publicado, já empacotado)

## Bindings do Worker

`ASSETS`, `CF_VERSION_METADATA`, `STORE` (Durable Object `Store`), `QUINTAL`
(serviço `caos-quintal`, entrypoint `Quintal`) e os segredos `SESSION_SECRET` e `EXPORT_KEY`.
Compatibility date `2025-09-01`.

Ainda não há script de publicação nesta pasta.
