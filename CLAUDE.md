# Projeto CAO(S) — contexto completo para IAs

> Documento de contexto do ecossistema **CAO(S)** (meucaos.com).
> Cole este arquivo inteiro no início da conversa (ChatGPT, Gemini, Claude) ou salve como `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` na raiz do projeto para Claude Code, Codex ou Gemini CLI.
> Última atualização: 10/10/2026.

---

## 1. Quem é o dono e como trabalhar com ele

- **Talys Fernandes** — empreendedor, fundador da **Yucaloo** (areia de gato biodegradável de mandioca). Opera no Brasil e nos EUA.
- Grupo **Vet Formulators** (EUA, Miramar/FL) com as marcas **Yucaloo, Muzzle and Mittens, The Pollinist, Treatzy**. Indústrias: fábrica de areia (Yucaloo) e fábrica de costura (Muzzle and Mittens). Mercados: Brasil e EUA.
- **Coco & Luna** (suplementos pet) é marca dele, mas **fica fora** do DRE do grupo Vet Formulators.
- Empresa brasileira: **Vita Pet Life Brasil LTDA**, Simples Nacional, sede no Paraná.
- Canais de venda: Mercado Livre (contas PR e SP), Shopee, Amazon (FBA Brasil), TikTok Shop, Shopify (Mandaê para envios, Mercado Pago como gateway, Meta Ads).
- Talys é o **MESTRE** do ecossistema: acima de todos os admins, vê e abre tudo, inclusive as senhas dos usuários.

### Regras de trabalho (importantes)
1. **Responder em português**, direto, curto, orientado a resultado. Nada de explicação longa.
2. **Não adicionar nada que não foi pedido.** Ele corrige com firmeza quando aparece funcionalidade extra ou quando um "desfazer" não volta exatamente ao que era.
3. **Manter o padrão visual único** em todo HTML/painel novo (ver seção 4).
4. **Entregar funcionando no ar** (deploy feito e testado), não só o código.
5. Painéis novos são **criados por fora** (com a IA), nunca por botões dentro do Quintal — evita que outras pessoas baguncem a estrutura.
6. Toda exclusão pede confirmação numa **janela (popup) com Cancelar/Excluir** — nunca "clique de novo para confirmar".
7. Todo painel: **engrenagem discreta isolada no canto inferior direito** (Ajustes), **PWA instalável**, **logo com efeito glitch** (liga/desliga global pelo Quintal), **login único pelo Quintal**.
8. Nunca expor chaves/senhas em resumos ou arquivos compartilhados.

---

## 2. Arquitetura geral

- **Hospedagem:** Cloudflare Workers (com Static Assets) + **D1** (SQLite) por painel; domínio próprio por painel (Custom Domain) em `*.meucaos.com`.
- **Frontend:** um `index.html` único por painel (HTML + CSS + JS puro inline, sem framework, sem build). Fonte do sistema (Inter/SF/Segoe).
- **Login único (SSO):** o **Quintal** (`meucaos.com`) é o hub de login. Cookie `caos_q` (Domain=meucaos.com, HttpOnly, 12 h). Cada painel chama o Quintal por **service binding** (`env.QUINTAL.check(cookie, panelKey, log)`) e recebe `{ role: 'admin' | 'view' | null, name, reason, glitch }`. Sem sessão → redireciona para `https://meucaos.com/?next=<url do painel>`.
- **Senha de emergência:** cada painel aceita uma senha própria de admin (`/api/login` com `kind:'admin'`) só para quando o Quintal estiver fora do ar.
- **Padrão "doc-store"** (usado nos painéis):
  - Tabela `docs(path TEXT PK, body TEXT JSON, updated INT)`; caminhos validados por regex (`PATH_RE`) e caminhos que o papel `view` pode gravar (`VIEW_RE`).
  - Endpoints: `GET /api/docs`, `GET /api/changes?since=`, `POST /api/docs {ops:[{path, body|null}]}`, `POST /api/files` + `GET /_blob/:id` (arquivos em partes de 1,8 MB no D1), `GET /api/export?key=` (backup).
  - Cliente: `commit()` → `flush()` com debounce; polling a cada ~12 s em `/api/changes`.
  - **Auto-atualização:** `GET /api/ver` devolve o ID da versão do worker (`version_metadata`); a página recarrega sozinha quando há deploy novo.
- **Backups:**
  - Foto diária no próprio D1 (`backup_docs` / `backup_kv`, 30 dias) via cron.
  - Tarefa agendada diária às 22:52 (São Paulo) baixa o `/api/export?key=` de cada painel e salva JSON numa pasta do **Google Drive** (`backup-auto-<painel>-AAAA-MM-DD.json`).
- **Ticks:** o plano grátis limita crons; a **Rotina principal** roda um cron a cada 5 min e chama o entrypoint `Tick` dos outros painéis (lembretes push, foto diária).
- **Push notifications:** Web Push próprio (VAPID + aes128gcm com WebCrypto, sem dependências), segredo `VAPID` = `{jwk, pub}`.
- **Deploy:** `npx wrangler deploy` em cada pasta de worker (token da Cloudflare do Talys — **não incluído aqui**). Segredos via `wrangler secret put` (`SESSION_SECRET`, `EXPORT_KEY`, `VAPID`).

---

## 3. Mapa dos painéis

| Painel | URL | Worker | Para quê |
|---|---|---|---|
| **Quintal do CAO(S)** | meucaos.com | `caos-quintal` | Hub: login, áreas, cards dos painéis, cadastro de pessoas, equipes, acessos. Expõe o entrypoint `Quintal` (SSO) |
| **Análise mensal** | analise-mensal.meucaos.com | `painel-caos` | Fechamento do mês por marca × mercado (BR/EUA, R$/US$): canais (Mercado Livre com tabela de Mercado Envios editável, Amazon FBA com tabela de tarifas editável e opção "Coleta FBA isenta", Shopee, Shopify com taxa conforme o plano, TikTok Shop), seeding (qtd por produto + custo total), DRE e canais. Publica resumos `sum/<marca>__<mercado>` e expõe o entrypoint `Sums` |
| **Análise semanal** | analise-semanal.meucaos.com | `painel-semanal` | Acompanhamento semanal (mesmas tabelas de ML/FBA) |
| **CAO(S) Rotina (do Talys)** | bem-vindo-ao.meucaos.com | `caos-rotina` | App principal do Talys: cards, quadro, agenda, gadgets (água, café, pausas, foco, bloco rápido), mascote CAO(S)INHO, XP, push. Tem a **caixa de Pedidos** (popup no botão "Pedidos") que recebe solicitações dos outros painéis (entrypoint `Inbox`). Cron de 5 min que dispara os Ticks |
| **Rotina do Charles** | charles.meucaos.com | `caos-charles` | Cópia da Rotina para o colaborador Charles (painel próprio, legado) |
| **Rotinas pessoais (modelo)** | rotina.meucaos.com/&lt;nome&gt;/ | `caos-rotinas` | Rotina em branco igual à do Charles, criada pelo Quintal para cada pessoa. **Um Durable Object com SQLite próprio por pessoa** (dados isolados). Só o dono e o mestre acessam |
| **Projeto Parceiros** | parceiros-do.meucaos.com | `caos-parceiros` | Influenciadores/UGC e reviews por marca. Modelo A (produto por conteúdo) e Modelo B (compra + reembolso + review). Árvore de pills por dia; pedidos de baixa/exclusão vão para a caixa de Pedidos da Rotina; custo logístico por envio (preparação, embalagem, outros); resumo "Enviados por produto" |
| **Árvore de Sustentabilidade** | arvore.meucaos.com | `caos-arvore` | Produtos, contas e ações por canal |
| **Envios Amazon FBA** | envios-amazon.meucaos.com | `caos-envios` | Remessas para o CD da Amazon: datas, NF, etiquetas, frete, problemas de recebimento |
| **DRE · Vet Formulators** | dre-vet.meucaos.com | `caos-dre` | DRE do grupo (marcas, indústrias, BR/EUA): plano de contas, importação OFX/CSV com regras, caixa, ativos, orçamento, fechamento, câmbio PTAX (BCB), auditoria. Puxa os números do Mensal (via `Sums`), sem a Coco & Luna |

Conta Cloudflare: `talysfernan@gmail.com` (ID da conta `7555b9666c694118eaab1e89c150e74b`). Cada worker tem seu banco D1 próprio (o das rotinas usa Durable Objects).

---

## 4. Padrão visual (obrigatório em tudo)

**Estilo:** escuro, minimalista, fundo com **grade de pontinhos**, blocos "node" com borda sutil, botões em **pílula**, animações suaves (`cubic-bezier(.2,.8,.2,1)`). Logo **CAOS em pixel** com caveira/gato e efeito **glitch**. Mascote **CAO(S)INHO** (gato/caveira em pixel art, olho verde e olho em X).

```css
:root{
  --bg:#0b0b0d; --node:#19191c; --node-2:#1f1f23; --well:#141416; --line:#2a2a30; --line-2:#36363d;
  --text:#ededf0; --text-2:#b6b6be; --muted:#85858e; --dim:#5a5a63;
  --green:#4ade80; --yellow:#facc15; --red:#f87171; --blue:#60a5fa;
  --radius:18px; --r-sm:12px; --ease:cubic-bezier(.2,.8,.2,1);
  --font:"Inter","SF Pro Display","Segoe UI Variable","Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;
}
body{background:var(--bg);color:var(--text);font-family:var(--font);font-size:13px;
  background-image:radial-gradient(rgba(255,255,255,.055) 1px,transparent 1.2px);background-size:22px 22px;background-attachment:fixed}
.pill{height:36px;padding:0 15px;border-radius:11px;background:var(--node);border:1px solid var(--line);color:var(--text-2)}
.pill.white{background:#f4f4f5;color:#111}        /* ação principal */
.node{background:linear-gradient(180deg,#1c1c20,#17171a);border:1px solid var(--line);border-radius:18px;
  box-shadow:0 1px 0 rgba(255,255,255,.035) inset,0 24px 48px -28px rgba(0,0,0,.85)}
.inp{height:38px;border-radius:10px;background:var(--well);border:1px solid var(--line);padding:0 12px}
.switch{width:34px;height:20px;border-radius:20px}  /* ligado = verde */
```

- Ícones: SVG em traço (stroke 1.6, cantos arredondados), 16 px.
- Título do painel numa **pílula** no topo (`.tpill`), logo acima com altura configurável.
- Engrenagem de Ajustes **sozinha no canto inferior direito**; ajustes abrem em gaveta/console.
- Toasts discretos embaixo, centralizados.
- Campos de senha: **nunca `type="password"`** no Quintal — usar `type="text"` com `-webkit-text-security:disc` e `autocomplete="off"` (sem sugestão/salvar senha do navegador e sem o "olhinho").
- **Temas de área** no Quintal (cores de destaque, aurora animada no fundo, título grande em gradiente itálico):
  - `base` padrão · `mkt` rosa→laranja (#f472b6/#fb923c) · `gold` dourado (#facc15/#f59e0b) · `teal` verde-água (#2dd4bf/#38bdf8) · `blue` (#60a5fa/#818cf8) · `violet` (#a78bfa/#f472b6).

---

## 5. Quintal — regras de negócio

### Entrada
- Abertura animada (uma vez por sessão) → no final abre o **popup de login: usuário + senha**.
- Mestre entra com o usuário **`mestre`** (configurável) + senha do mestre.
- O CAO(S)INHO recebe a pessoa **pelo primeiro nome** (balão no canto inferior esquerdo, estilo "Clippy"; dá dicas, sugere painel, pode ser escondido).

### Estrutura
- **Áreas** = abas no topo, cada uma com tema próprio: **Ferramentas**, **Rotina**, **Marketing**, **Diretoria**, **Controladoria** (o mestre cria mais).
- **Categorias** agrupam os cards dentro de uma área.
- **Painéis** = cards (nome, ícone/letra, cor, descrição, link, categoria). Três estilos de card selecionáveis: **Cartões**, **Blocos**, **Lista**.

### Acessos (modelo pensado para crescer sem embolar)
- **Mestre:** vê e abre tudo. Os Ajustes pedem a senha do mestre de novo (vale 15 min; trancam após 10 min parado).
- **Equipes:** cada equipe tem uma lista de painéis com nível (**Uso** ou **Admin**). A pessoa herda tudo das equipes dela.
- **Liberação individual:** exceções por pessoa. **Vale sempre o maior** entre equipe e individual.
- **Rotina pessoal:** cada rotina tem **um dono**; só o dono e o mestre a enxergam. Não entra em equipes nem pode ser liberada para outros. O dono pode "editar tudo" (admin) ou "só usar".
- Cada pessoa só vê as **áreas onde tem ao menos um painel**.
- Níveis dentro de um painel: **Admin** (ajustes do painel) e **Uso** (só usa).

### Cadastro de pessoa
Nome, usuário (login), cargo, e-mail, observação, ativo/inativo, senha (o mestre pode **ver**, copiar ou gerar; cada visualização fica registrada), equipes, liberações individuais e rotina pessoal ("Criar a partir do modelo").

### Segurança
- Senhas: hash (SHA-256 com segredo) para login + cópia cifrada (AES-GCM) que só o mestre abre.
- Bloqueio: 40 erros em 10 min por IP.
- Auditoria em **Acessos**: entradas, aberturas de painel, senhas vistas, alterações.
- "Encerrar outras sessões" derruba o mestre em outros aparelhos.

### Dados do Quintal (D1, tabela `kv`)
```js
cfg = { title, logo, logoSize, greet, newTab, glitch, layout:'cards'|'tiles'|'list', mascot, masterUser,
        areas:[{id,name,theme,icon,sub}], cats:[{id,name,area}],
        teams:[{id,name,color,access:{panelId:'view'|'admin'}}] }
panels = [{ id, name, url, desc, color, icon, key, cat,
            kind?:'rotina', owner?:userId, ownerRole?:'admin'|'view', slug? }]
users  = [{ id, name, user, cargo, email, note, pass(hash), passEnc, active,
            teams:[teamId], access:[panelId], admin:[panelId] }]
```
- `key` do painel = identificador usado pelo SSO (`mensal`, `semanal`, `rotina`, `parceiros`, `charles`, `arvore`, `envios`, `dre`, e `r:<slug>` para rotinas do modelo).
- Entrypoint `Quintal`: `check(cookie, key, log)`, `board(slug)` → `{exists, title}`, `boards()` → lista de slugs.

---

## 6. Como criar um painel novo (receita)

1. Pasta nova com `wrangler.jsonc` (nome `caos-<algo>`, custom domain `<algo>.meucaos.com`, D1 próprio, `assets` com `run_worker_first`, `version_metadata`, service binding `QUINTAL → caos-quintal#Quintal`).
2. Worker com o padrão doc-store (seção 2), `/api/session` via `QUINTAL.check`, `/api/export?key=`, `/api/ver`, foto diária e `Tick` se precisar.
3. `public/index.html` no padrão visual (seção 4) + PWA (`manifest.webmanifest`, `sw.js`, ícones 192/512/maskable, favicon do gato) + glitch no logo + engrenagem no canto.
4. Cadastrar o painel no Quintal (Ajustes → Painéis) com o `key` igual ao do worker e a categoria/área certa; liberar por equipe ou individualmente.
5. Incluir o painel na tarefa de backup diário para o Google Drive.
6. Testar no ar (login como mestre e como usuário comum) antes de dar como pronto.

---

## 7. Glossário rápido

- **Mestre** — o Talys; acesso total.
- **Quintal** — o hub em meucaos.com.
- **Área** — aba do topo do Quintal (Ferramentas, Rotina, Marketing, Diretoria, Controladoria…).
- **Pills / pendências** — tarefas do painel de Parceiros, por dia.
- **Baixa** — encerrar uma pill/envio com motivo; pedidos de baixa/exclusão vão para a **caixa de Pedidos** da Rotina do Talys.
- **Seeding** — envio de produtos grátis para divulgação (contado no Mensal como custo).
- **CAO(S)INHO** — o mascote.
- **Modelo** — a rotina em branco que o mestre duplica para cada pessoa.

---

## 8. Este repositório (talysfernan/vite-react)

- `constelacao/` — painel **Constelação de ações** (worker `caos-constelacao`) em **constelacao.meucaos.com**, com bandeiras BR/US no canto para alternar. Cada país tem seus dados (Durable Object `br`/`us`) e sua chave no Quintal (`constelacao-br`/`constelacao-us`). O país vem do cabeçalho `x-board` (app), depois do cookie `cst_b`; `?pais=br|us` escolhe ao abrir. Os endereços antigos constelacao-br/us redirecionam para o novo.
  - `public/` = estático (`index.html` é o app inteiro); `worker.js` = worker + Durable Object `Store` (cópia do que está no ar, já empacotado).
  - Base = versão feita no Cowork e baixada do Cloudflare em 11/10/2026. A versão antiga (branch `claude/jolly-thompson-qxpaie`) foi descartada — nunca usá-la nem o `deploy.sh` dela.
  - Deploy: `cd constelacao && CLOUDFLARE_API_TOKEN=proxy npx -y wrangler@4.40.0 deploy` (no Claude Code na nuvem o proxy injeta a credencial).
  - O proxy quebra o envio de assets do wrangler (401 no upload), por isso o `index.html` vai embutido no código: `site.js` é a entrada, serve `/` e repassa o resto ao `worker.js`; `public/.assetsignore` tira o `index.html` dos assets. Os outros arquivos de `public/` só são enviados se não mudarem — se mudar um ícone/sw.js, o upload falha e precisa de outro caminho.
  - Anexos: `POST /api/files` (corpo = arquivo, cabeçalhos `x-name`, `x-board`), `GET /api/blob/:id?b=br|us[&dl=1]`, `DELETE /api/files/:id`; guardados em partes de 1,8 MB nas tabelas `files`/`file_parts` do Durable Object do país (fora da foto diária e do export).
  - Teste local com o servidor real: `.dev.vars` com `SESSION_SECRET=...` e `npx wrangler dev`; login local pela senha de emergência padrão.
  - Antes de publicar, anotar a versão atual (`/workers/scripts/caos-constelacao/deployments`) para poder voltar.
- `parceiros/` — **Projeto Parceiros** (worker `caos-parceiros`, parceiros-do.meucaos.com), cópia do que está no ar. Um painel por país com bandeiras BR/US no topo: banco `DB` (Brasil) e `DB_US` (caos-parceiros-us-db), chaves `parceiros-br`/`parceiros-us` no Quintal; país pelo `x-board`, `?b=`/`?pais=` ou cookie `prt_b`. Publicar: `python3 parceiros/deploy.py` (só o código, mantém assets e bindings).
- `quintal/` — **Quintal** (worker `caos-quintal`), cópia do que está no ar. Publicar: `python3 quintal/deploy.py`.
- Fluxo das correções:
  1. Uma correção por vez, só o que foi pedido.
  2. Testar no navegador (Playwright) com a API simulada.
  3. Atualizar a **cópia de teste** (`python3 constelacao/preview.py <saída>`, publicada como artifact privado) para o Talys testar.
  4. Commit + push na branch de trabalho.
  5. Publicar no Cloudflare e conferir no ar (Talys liberou publicar direto, seguindo a seção 1).

---

## 9. Padrões aprovados pelo Talys (valem para todo painel novo)

Aprendidos na Constelação (out/2026). Seguir sem precisar perguntar de novo.

### Jeito de trabalhar
- Uma coisa por vez; quando ele pré-aprovar um estilo, seguir em sequência sem perguntar a cada passo.
- Antes de algo grande (pop-up complexo, painel novo), mostrar a proposta em tópicos curtos e pedir ok.
- Cada entrega: testar no navegador (Playwright, com API simulada ou `wrangler dev` local), publicar, conferir no ar e mandar print.
- Nunca mudar o que não foi pedido; quando ele volta atrás numa ideia, voltar exatamente ao que era.

### Interação
- Adicionar algo **não abre pop-up**; só abre quando ele clica no item depois.
- Clicar dentro de um pop-up **não pode piscar**: atualizar o conteúdo no lugar (sem recriar o modal nem repetir animação), mantendo rolagem e foco.
- Hover com opções: listas de "pills vitrificadas" empilhadas, com a sugestão mais provável primeiro e embaixo do cursor; dá para clicar ou arrastar.
- Arrastar com ímã: alinhar com elementos próximos dá um "pulo" + guia tracejada discreta (+ vibração curta no celular).
- Cursor: só a mãozinha de clique ou de arrastar; nunca cruz ou cursor de copiar.
- Exclusão sempre com janela Cancelar/Excluir. Desligar uma opção (ex.: verba) esconde o valor, não apaga.

### Visual
- Controles discretos em vidro: `background: rgba(255,255,255,.04–.08)`, borda `rgba(255,255,255,.1–.16)`, `backdrop-filter: blur(8–18px) saturate(1.4)`, tamanhos pequenos (16–30px). Nada de branco sólido em controles secundários.
- Transições suaves com `var(--ease)`; trocas de aba deslizam/aparecem na direção da troca; respeitar `prefers-reduced-motion`.
- Barra de ferramentas: vidro, itens agrupados com separadores finos, hover sobe 3px e o ícone cresce de leve.

### Pop-ups
- Cada tipo de item tem pop-up próprio, pensado para o que ele é (nada de formulário genérico):
  - título com placeholder do tipo ("Nome do roteiro"…), **etapa** com nomes próprios do tipo, seções com títulos curtos em maiúsculas;
  - **Arquivos e links** em destaque quando o item normalmente tem um arquivo (roteiro, arte, contrato): arrastar/escolher + links, com uma dica do que subir;
  - o que é raro fica recolhido em "Mais opções"; rodapé com Excluir · (Duplicar) · Pronto.
- Item complexo (ex.: Plano) usa abas com contador (`Anexos 3`, `Tarefas 2/5`) e lembra a última aba aberta.
- Itens rápidos (ex.: Ação) cabem em um pop-up estreito: o quê, quem, prazo e "marcar como feita".

### Painel e dados
- BR e US no mesmo painel, com bandeiras (SVG, não emoji) no canto para alternar; dados separados por país.
- Anexos: `POST /api/files` em partes de 1,8 MB no SQLite; servir com `?b=` para imagens/downloads.

