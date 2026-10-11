#!/usr/bin/env bash
# Publica o Worker "caos-constelacao" (os dois painéis por país) via API do Cloudflare.
# Uso: ./deploy.sh            (redeploy, mantém o segredo)
#      FIRST=1 ./deploy.sh    (primeira publicação: cria o Durable Object e o segredo)
set -euo pipefail
cd "$(dirname "$0")"
A=7555b9666c694118eaab1e89c150e74b
API=https://api.cloudflare.com/client/v4/accounts/$A/workers/scripts/caos-constelacao
python3 build.py
if [ "${FIRST:-}" = "1" ]; then
  SECRET=$(python3 -c 'import secrets;print(secrets.token_urlsafe(40))')
  META=$(cat <<J
{"main_module":"worker.js","compatibility_date":"2025-09-01",
 "bindings":[{"type":"durable_object_namespace","name":"STORE","class_name":"Store"},
             {"type":"secret_text","name":"SESSION_SECRET","text":"$SECRET"}],
 "migrations":{"new_tag":"v1","new_sqlite_classes":["Store"]}}
J
)
else
  META='{"main_module":"worker.js","compatibility_date":"2025-09-01",
 "bindings":[{"type":"durable_object_namespace","name":"STORE","class_name":"Store"}],
 "keep_bindings":["secret_text"]}'
fi
curl -sS -X PUT "$API" \
  -F "metadata=$META;type=application/json" \
  -F "worker.js=@src/worker.js;type=application/javascript+module" \
  -F "index.html=@dist/index.html;type=text/plain" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("ok" if d["success"] else d["errors"])'
# backup diário: feito no primeiro acesso de cada dia (o plano grátis limita crons)
