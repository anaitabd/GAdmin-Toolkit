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

echo "Starting API server..."
exec node main/api/server.js
