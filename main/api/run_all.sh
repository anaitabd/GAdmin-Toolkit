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

echo "Importing data..."
node main/api/db/import.js

echo "Running delete.js..."
node main/api/delete.js

echo "Running generate.js..."
node main/api/generate.js "${DOMAIN}" "${NUM_RECORDS}"

echo "Running create.js..."
node main/api/create.js

case "${RUN_SEND_MODE}" in
  gmail_api)
    echo "Running sendApi.js..."
    node main/api/sendApi.js
    ;;
  smtp)
    echo "Running smtp.js..."
    node main/api/smtp.js
    ;;
  none)
    echo "Skipping email send (RUN_SEND_MODE=none)"
    ;;
  *)
    echo "Unknown RUN_SEND_MODE: ${RUN_SEND_MODE}"
    exit 1
    ;;
esac

echo "All tasks completed."
