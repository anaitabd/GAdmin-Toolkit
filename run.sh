#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

cmd="${1:-up}"

case "$cmd" in
	build)
		docker compose build
		;;
	up)
		docker compose up -d --build
		;;
	down)
		docker compose down
		;;
	-h|--help|help)
		echo "Usage: ./run.sh [build|up|down]"
		exit 0
		;;
	*)
		echo "Commande inconnue: $cmd" >&2
		echo "Usage: ./run.sh [build|up|down]" >&2
		exit 1
		;;
esac

echo "Frontend: http://localhost:3000"
echo "API:      http://localhost:3001/api"
echo "Health:   curl -H 'x-api-key: <API_KEY>' http://localhost:3001/api/health"
