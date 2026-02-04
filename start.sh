#!/bin/bash
# Startup script for GAdmin-Toolkit
# Ensures all required directories exist and starts the services

set -e

echo "🚀 Starting GAdmin-Toolkit..."

# Create required directories
echo "📁 Creating directories..."
mkdir -p logs files

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Please create one from .env.example"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if Docker services are running
echo "🐳 Checking Docker services..."
if ! docker ps | grep -q "gadmin-postgres"; then
    echo "Starting PostgreSQL..."
    docker compose up -d postgres
    sleep 5
fi

if ! docker ps | grep -q "gadmin-redis"; then
    echo "Starting Redis..."
    docker compose up -d redis
    sleep 2
fi

# Wait for database to be ready
echo "⏳ Waiting for database..."
until docker exec gadmin-postgres pg_isready -U gadmin > /dev/null 2>&1; do
    sleep 1
done
echo "✅ Database is ready"

# Update DATABASE_URL for localhost connection
export DATABASE_URL="postgresql://gadmin:${DB_PASSWORD}@localhost:5432/gadmin_toolkit"

# Start the API server
echo "🌐 Starting API server..."
NODE_ENV=development node src/server.js
