#!/bin/bash

# Stop all services script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Stopping Spexture-com Services                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Stop frontend client
echo -e "${CYAN}[1/3] Stopping frontend client...${NC}"
if [ -f "$PROJECT_ROOT/.client.pid" ]; then
    CLIENT_PID=$(cat "$PROJECT_ROOT/.client.pid")
    if ps -p $CLIENT_PID > /dev/null 2>&1; then
        kill $CLIENT_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Frontend client stopped (PID: $CLIENT_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend client was not running${NC}"
    fi
    rm "$PROJECT_ROOT/.client.pid"
else
    # Try to find and kill any process on port 3000
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        kill -9 $(lsof -t -i:3000) 2>/dev/null || true
        echo -e "${GREEN}✅ Frontend client stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend client was not running${NC}"
    fi
fi
echo ""

# Stop backend server
echo -e "${CYAN}[2/3] Stopping backend server...${NC}"
if [ -f "$PROJECT_ROOT/.server.pid" ]; then
    SERVER_PID=$(cat "$PROJECT_ROOT/.server.pid")
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        kill $SERVER_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Backend server stopped (PID: $SERVER_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend server was not running${NC}"
    fi
    rm "$PROJECT_ROOT/.server.pid"
else
    # Try to find and kill any process on port 3001
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        kill -9 $(lsof -t -i:3001) 2>/dev/null || true
        echo -e "${GREEN}✅ Backend server stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend server was not running${NC}"
    fi
fi
echo ""

# Stop Docker services
echo -e "${CYAN}[3/3] Stopping Docker services...${NC}"
cd "$PROJECT_ROOT"
docker compose down
echo -e "${GREEN}✅ Docker services stopped${NC}"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  All services stopped successfully                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}To start services again:${NC}"
echo -e "   ${YELLOW}./scripts/test-e2e-setup.sh${NC}"
echo ""

