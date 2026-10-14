# Roteiros · Parceiros

Painel `caos-roteiros` em **roteiros.meucaos.com** (chave no Quintal: `roteiros`).

- **Manual** — guia do colaborador (base: documento “Programa Parceiros”), editável pelo admin direto na página.
- **Fluxos do direct** — conversas coladas pelo admin (Marca/Parceiro), cada mensagem da marca copia com um clique.
- **Gerador** — mensagens iniciais curtas no tom da marca (PT/EN), sem repetir as já copiadas no aparelho.

Estrutura: `site.js` (entrada; serve o HTML, PWA e ícones direto do código, sem envio de assets) +
`worker.js` (API doc-store num Durable Object `Store` com SQLite). Papel `view` só lê.

Deploy: `cd roteiros && CLOUDFLARE_API_TOKEN=proxy npx -y wrangler@4.40.0 deploy`
Cópia de teste: `python3 roteiros/preview.py <saída.html>`
