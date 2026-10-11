# Constelação de ações

Painel de linha do tempo mensal (teia de ações) do CAO(S), um por país:

- 🇧🇷 https://constelacao-br.meucaos.com
- 🇺🇸 https://constelacao-us.meucaos.com

Um único Worker (`caos-constelacao`) atende os dois hostnames; o país vem do subdomínio.
Os dados ficam num Durable Object (SQLite). Cadastros (pessoas, times, marcas, canais, lojas)
são compartilhados entre os países; a teia e os ajustes são separados por país.
Login único pelo Quintal do CAO(S) (service binding `QUINTAL`), com senha de emergência
em `?emergencia`. Backup diário automático no primeiro acesso de cada dia (30 dias).

## Estrutura

- `src/worker.js` — API + Durable Object
- `src/index.src.html` — app (canvas, pop-ups, ajustes) em um arquivo
- `src/si.json` — logos de canais/lojas (simple-icons)
- `build.py` — gera `dist/index.html`
- `deploy.sh` — publica via API do Cloudflare (`FIRST=1` só na primeira vez)
