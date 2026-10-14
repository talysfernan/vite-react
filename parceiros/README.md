# Projeto Parceiros (caos-parceiros)

Cópia do que está no ar em parceiros-do.meucaos.com (baixada do Cloudflare em 14/10/2026).

- `site.js` = entrada; serve o `index.html` embutido e repassa o resto ao `index.js` (worker já empacotado).
- Publicação: `python3 deploy.py` — envia só o código pela API (mantém assets, D1, segredos e service binding que já estão no ar).
