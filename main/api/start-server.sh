#!/bin/bash

# Start script for GAdmin-Toolkit API Server
# This script starts the API server with proper configuration

cd "$(dirname "$0")"

echo "=========================================="
echo "Starting GAdmin-Toolkit API Server"
echo "=========================================="
echo ""

# Check for required environment variables
REQUIRED_VARS=("PGHOST" "PGDATABASE" "PGUSER" "PGPASSWORD")
MISSING_VARS=()

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        MISSING_VARS+=("$VAR")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️  WARNING: Missing required environment variables:"
    for VAR in "${MISSING_VARS[@]}"; do
        echo "    - $VAR"
    done
    echo ""
    echo "The API will start but database operations will fail."
    echo "Please set these variables before using the API:"
    echo ""
    echo "export PGHOST=your_host"
    echo "export PGPORT=5432"
    echo "export PGDATABASE=your_database"
    echo "export PGUSER=your_user"
    echo "export PGPASSWORD=your_password"
    echo "export PGSSL=true  # or false"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 1
    fi
fi

# Set default port if not specified
PORT=${PORT:-3000}

echo "✓ Starting API server on port $PORT"
echo "✓ Press Ctrl+C to stop the server"
echo ""

# Start the server
node server.js
