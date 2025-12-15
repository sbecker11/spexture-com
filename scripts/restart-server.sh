#!/bin/bash

# Script to restart the server
# Kills any existing process on port 3001 and starts the server

PORT=3001
SERVER_DIR="$(cd "$(dirname "$0")/../server" && pwd)"

echo "🛑 Stopping server on port $PORT..."

# Kill any process using port 3001
lsof -ti:$PORT | xargs kill -9 2>/dev/null

# Wait a moment for the port to be released
sleep 2

echo "🚀 Starting server..."
cd "$SERVER_DIR"
npm run dev

