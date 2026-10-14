# Projeto Parceiros (caos-parceiros)

Cópia do que está no ar em parceiros-do.meucaos.com (baixada do Cloudflare em 14/10/2026).

- Um painel por país, com bandeiras BR/US no canto superior direito. Cada país tem o seu banco D1 (`DB` = caos-parceiros-db, `DB_US` = caos-parceiros-us-db) e a sua chave no Quintal (`parceiros-br` / `parceiros-us`).
- O país vem do cabeçalho `x-board` (app), depois de `?b=` (imagens) ou `?pais=`, depois do cookie `prt_b`. Export: `/api/export?key=...&pais=us`.
- `site.js` = entrada; serve o `index.html` embutido, escolhe o banco do país e repassa o resto ao `index.js` (worker já empacotado).
- Publicação: `python3 deploy.py` — envia só o código pela API (mantém assets, D1, segredos e service binding que já estão no ar).
