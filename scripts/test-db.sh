#!/usr/bin/env bash
# Roda a suíte pgTAP (supabase/tests/database/*.sql) contra o projeto Supabase
# de TESTE (lufichapoledev) — NUNCA contra produção.
#
# Requer .env.test.local preenchido (ver .env.test.example) ou as mesmas
# variáveis já exportadas no ambiente (usado no CI).
set -euo pipefail

export PATH="/opt/homebrew/opt/libpq/bin:$PATH"

cd "$(dirname "$0")/.."

if [ -f .env.test.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.test.local
  set +a
fi

required_vars=(NEXT_PUBLIC_SUPABASE_TEST_URL SUPABASE_TEST_DB_PASSWORD SUPABASE_TEST_DB_POOLER_HOST SUPABASE_TEST_DB_POOLER_PORT)
for v in "${required_vars[@]}"; do
  if [ -z "${!v:-}" ]; then
    echo "Faltando variável $v (ver .env.test.example). Abortando." >&2
    exit 1
  fi
done

REF=$(echo "$NEXT_PUBLIC_SUPABASE_TEST_URL" | sed -E 's#https://([^.]+)\.supabase\.co.*#\1#')
ENC_PW=$(python3 -c "import os,urllib.parse; print(urllib.parse.quote(os.environ['SUPABASE_TEST_DB_PASSWORD'], safe=''))")
DB_URL="postgresql://postgres.${REF}:${ENC_PW}@${SUPABASE_TEST_DB_POOLER_HOST}:${SUPABASE_TEST_DB_POOLER_PORT}/postgres"

echo "==> Resetando schema público do banco de teste (lufichapoledev)..."
psql "$DB_URL" -v ON_ERROR_STOP=1 -q << 'SQL'
drop schema if exists public cascade;
create schema public;
grant all on schema public to postgres, anon, authenticated, service_role;
SQL

echo "==> Aplicando migrations..."
for f in supabase/migrations/*.sql; do
  echo "  - $f"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$f"
done

echo "==> Aplicando seed..."
psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f supabase/seed.sql

echo "==> Garantindo extensão pgtap..."
psql "$DB_URL" -v ON_ERROR_STOP=1 -q -c "create extension if not exists pgtap;"

echo "==> Rodando testes pgTAP..."
status=0
for f in supabase/tests/database/*.sql; do
  echo "--- $f ---"
  if ! psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$f"; then
    status=1
  fi
done

if [ "$status" -ne 0 ]; then
  echo "FALHA nos testes de banco." >&2
  exit 1
fi

echo "OK: testes de banco passaram."
