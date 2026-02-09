#!/usr/bin/env bash
set -euo pipefail

DB_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"

echo "Waiting for database..."
for i in {1..30}; do
  if psql "$DB_URL" -c "select 1" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Applying schema..."
psql "$DB_URL" -f main/api/db/schema.sql

echo "Applying migrations..."
for migration in main/api/db/migrations/*.sql; do
  [ -f "$migration" ] || continue
  echo "  -> $(basename "$migration")"
  psql "$DB_URL" -f "$migration" 2>&1 || true
done

echo "Starting API server..."
exec node main/api/server.js
