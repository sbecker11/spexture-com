#!/bin/bash

# Script to restart the server
# Kills any existing process on the configured port and starts the server

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables from .env file if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

PORT=${SPEXTURE_SERVER_PORT:-3011}
SERVER_DIR="$PROJECT_ROOT/server"

echo "🛑 Stopping server on port $PORT..."

# Kill any process using the configured port
lsof -ti:$PORT | xargs kill -9 2>/dev/null

# Wait a moment for the port to be released
sleep 2

echo "🚀 Starting server on port $PORT..."
cd "$SERVER_DIR"
PORT=$PORT npm run dev

