#!/bin/bash

# Ensure Docker Services Are Running
# Checks if Docker services are running and starts them if needed

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${YELLOW}Checking Docker services...${NC}"

# Check if PostgreSQL is running
if ! docker compose ps postgres | grep -q "Up"; then
    echo -e "${YELLOW}PostgreSQL not running. Starting...${NC}"
    cd "$PROJECT_ROOT"
    docker compose up -d postgres
    echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    sleep 5
    
    # Wait for database to be ready
    MAX_ATTEMPTS=30
    ATTEMPT=0
    while ! docker compose exec -T postgres pg_isready -U superapp_user -d react_super_app > /dev/null 2>&1; do
        ATTEMPT=$((ATTEMPT + 1))
        if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            echo -e "${RED}❌ PostgreSQL failed to start${NC}"
            exit 1
        fi
        sleep 2
    done
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
fi

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${YELLOW}Server not running. Starting...${NC}"
    cd "$PROJECT_ROOT/server"
    
    # Check if server is already running on port 3001
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Port 3001 is in use. Killing existing process...${NC}"
        kill -9 $(lsof -t -i:3001) 2>/dev/null || true
        sleep 2
    fi
    
    # Start server in background
    npm run dev > /dev/null 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > "$PROJECT_ROOT/.server.pid"
    
    # Wait for server to be ready
    MAX_ATTEMPTS=20
    ATTEMPT=0
    while ! curl -s http://localhost:3001/health > /dev/null 2>&1; do
        ATTEMPT=$((ATTEMPT + 1))
        if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            echo -e "${RED}❌ Server failed to start${NC}"
            kill $SERVER_PID 2>/dev/null || true
            exit 1
        fi
        sleep 2
    done
    echo -e "${GREEN}✅ Server is running (PID: $SERVER_PID)${NC}"
else
    echo -e "${GREEN}✅ Server is running${NC}"
fi

echo -e "${GREEN}✅ All Docker services are ready${NC}"

