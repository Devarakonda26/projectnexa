#!/usr/bin/env bash
# Builds a throwaway database, applies the Supabase shim + all migrations + seed data,
# then runs every tests/db/t_*.sql assertion file. Any failure exits non-zero.
#
# Usage:  PGHOST=... PGPORT=... PGUSER=postgres scripts/test-db.sh
# The database is dropped and recreated each run, so point it at a disposable server.
set -euo pipefail

cd "$(dirname "$0")/.."
DB="${TEST_DB_NAME:-nexa_test}"
export PGUSER="${PGUSER:-postgres}"

admin() { psql -X -q -v ON_ERROR_STOP=1 -d postgres "$@"; }
run()   { psql -X -q -v ON_ERROR_STOP=1 -d "$DB" "$@"; }

admin -c "drop database if exists ${DB} with (force)" -c "create database ${DB}"

echo "==> shim"
run -f tests/db/00_supabase_shim.sql

echo "==> migrations"
for f in supabase/migrations/*.sql; do
  echo "    $f"
  run -f "$f"
done

echo "==> seed"
run -f supabase/seed.sql

fail=0
for t in tests/db/t_*.sql; do
  echo "==> $t"
  if ! run -f "$t" 2>&1 | sed 's/^/    /'; then
    fail=1
  fi
done

if [ "$fail" -ne 0 ] || ! run -c "select 1" >/dev/null; then
  echo "DB TESTS FAILED" >&2
  exit 1
fi
echo "DB TESTS PASSED"
