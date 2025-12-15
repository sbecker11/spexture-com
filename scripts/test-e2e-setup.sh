#!/bin/bash

# End-to-End Testing Setup Script
# This script initializes the entire stack for testing

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  React Super App - End-to-End Testing Setup               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Interactive prompt for cleanup level
echo -e "${YELLOW}Choose cleanup level:${NC}"
echo -e "  ${GREEN}1)${NC} Quick start (keep database data, remove old images)"
echo -e "  ${GREEN}2)${NC} Fresh start (remove everything including database)"
echo -e "  ${GREEN}3)${NC} Skip cleanup (fastest, use existing containers)"
echo ""
read -p "Enter choice [1-3] (default: 1): " -n 1 -r CLEANUP_CHOICE
echo ""
echo ""

# Set default if no choice
if [ -z "$CLEANUP_CHOICE" ]; then
    CLEANUP_CHOICE="1"
fi

# Validate choice
if [[ ! "$CLEANUP_CHOICE" =~ ^[1-3]$ ]]; then
    echo -e "${RED}Invalid choice. Using default (1).${NC}"
    CLEANUP_CHOICE="1"
fi

CLEAN_VOLUMES=false
CLEAN_IMAGES=true
SKIP_CLEANUP=false

case $CLEANUP_CHOICE in
    1)
        echo -e "${CYAN}→ Quick start: Keeping database data${NC}"
        CLEAN_VOLUMES=false
        CLEAN_IMAGES=true
        ;;
    2)
        echo -e "${CYAN}→ Fresh start: Removing all Docker resources${NC}"
        CLEAN_VOLUMES=true
        CLEAN_IMAGES=true
        ;;
    3)
        echo -e "${CYAN}→ Skip cleanup: Using existing containers${NC}"
        SKIP_CLEANUP=true
        ;;
esac
echo ""

# Step 1: Check Docker Desktop
echo -e "${CYAN}[1/8] Checking Docker Desktop...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo ""
    echo -e "${YELLOW}Please start Docker Desktop and try again.${NC}"
    echo -e "${YELLOW}On macOS: Open Docker Desktop from Applications${NC}"
    echo -e "${YELLOW}On Windows: Open Docker Desktop from Start Menu${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Desktop is running${NC}"
echo ""

# Step 2: Check for port conflicts
echo -e "${CYAN}[2/7] Checking for port conflicts...${NC}"

# Check if port 5432 is in use
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 5432 is already in use${NC}"
    
    # Check if it's a Docker container
    CONTAINER_ON_5432=$(docker ps -q --filter "publish=5432" 2>/dev/null || true)
    if [ -n "$CONTAINER_ON_5432" ]; then
        echo -e "${YELLOW}   Stopping Docker container on port 5432...${NC}"
        docker stop $CONTAINER_ON_5432 > /dev/null 2>&1 || true
        docker rm $CONTAINER_ON_5432 > /dev/null 2>&1 || true
    else
        echo -e "${RED}❌ Port 5432 is in use by a non-Docker process (likely local PostgreSQL)${NC}"
        echo ""
        echo -e "${YELLOW}Please choose an option:${NC}"
        echo -e "  ${GREEN}1)${NC} Stop local PostgreSQL: ${CYAN}brew services stop postgresql${NC} (macOS)"
        echo -e "  ${GREEN}2)${NC} Stop local PostgreSQL: ${CYAN}sudo systemctl stop postgresql${NC} (Linux)"
        echo -e "  ${GREEN}3)${NC} Use different port: ${CYAN}export POSTGRES_PORT=5433${NC} then re-run"
        echo ""
        exit 1
    fi
fi

# Check if port 3001 is in use
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3001 is in use. Killing process...${NC}"
    kill -9 $(lsof -t -i:3001) 2>/dev/null || true
    sleep 1
fi

# Check if port 3000 is in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 is in use. Killing process...${NC}"
    kill -9 $(lsof -t -i:3000) 2>/dev/null || true
    sleep 1
fi

echo -e "${GREEN}✅ Port check complete${NC}"
echo ""

# Step 3: Clean up existing Docker resources
echo -e "${CYAN}[3/8] Cleaning up existing Docker resources...${NC}"
cd "$PROJECT_ROOT"

if [ "$SKIP_CLEANUP" = true ]; then
    echo -e "${YELLOW}   Skipping cleanup (using existing containers)${NC}"
else
    # Stop and remove containers
    echo -e "${YELLOW}   Stopping containers...${NC}"
    if [ "$CLEAN_VOLUMES" = true ]; then
        docker compose down -v > /dev/null 2>&1 || true
    else
        docker compose down > /dev/null 2>&1 || true
    fi

    # Remove project-specific images
    if [ "$CLEAN_IMAGES" = true ]; then
        echo -e "${YELLOW}   Removing old images...${NC}"
        docker images | grep "react-super-app" | awk '{print $3}' | xargs -r docker rmi -f > /dev/null 2>&1 || true
        docker images | grep "react_super_app" | awk '{print $3}' | xargs -r docker rmi -f > /dev/null 2>&1 || true
    fi

    # Remove volumes if requested
    if [ "$CLEAN_VOLUMES" = true ]; then
        echo -e "${YELLOW}   Removing volumes (fresh database)...${NC}"
        docker volume rm react-super-app_postgres_data > /dev/null 2>&1 || true
    fi
fi

echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

# Step 4: Start Docker services
echo -e "${CYAN}[4/8] Starting Docker services (database)...${NC}"
docker compose up -d postgres
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
sleep 5

# Wait for database to be ready
MAX_ATTEMPTS=30
ATTEMPT=0
while ! docker exec react_super_app_postgres pg_isready -U superapp_user -d react_super_app > /dev/null 2>&1; do
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Database failed to start after ${MAX_ATTEMPTS} attempts${NC}"
        exit 1
    fi
    echo -e "${YELLOW}   Waiting... (${ATTEMPT}/${MAX_ATTEMPTS})${NC}"
    sleep 2
done
echo -e "${GREEN}✅ Database is ready${NC}"
echo ""

# Step 5: Run database migration
echo -e "${CYAN}[5/8] Running database migration...${NC}"
"$SCRIPT_DIR/run-migration.sh" 001
echo ""

# Step 6: Start backend server
echo -e "${CYAN}[6/8] Starting backend server...${NC}"
cd "$PROJECT_ROOT/server"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⏳ Installing server dependencies...${NC}"
    npm install
fi

# Check if server is already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3001 is already in use. Killing existing process...${NC}"
    kill -9 $(lsof -t -i:3001) 2>/dev/null || true
    sleep 2
fi

echo -e "${YELLOW}⏳ Starting server on port 3001...${NC}"
npm start > /dev/null 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "$PROJECT_ROOT/.server.pid"

# Wait for server to be ready
sleep 3
MAX_ATTEMPTS=20
ATTEMPT=0
while ! curl -s http://localhost:3001/health > /dev/null 2>&1; do
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Server failed to start after ${MAX_ATTEMPTS} attempts${NC}"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    echo -e "${YELLOW}   Waiting for server... (${ATTEMPT}/${MAX_ATTEMPTS})${NC}"
    sleep 2
done
echo -e "${GREEN}✅ Backend server is running (PID: $SERVER_PID)${NC}"
echo ""

# Step 7: Start frontend client
echo -e "${CYAN}[7/8] Starting frontend client...${NC}"
cd "$PROJECT_ROOT"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⏳ Installing client dependencies...${NC}"
    npm install
fi

# Check if client is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use. Killing existing process...${NC}"
    kill -9 $(lsof -t -i:3000) 2>/dev/null || true
    sleep 2
fi

echo -e "${YELLOW}⏳ Starting React app on port 3000...${NC}"
BROWSER=none npm start > /dev/null 2>&1 &
CLIENT_PID=$!
echo $CLIENT_PID > "$PROJECT_ROOT/.client.pid"

# Wait for client to be ready
sleep 5
MAX_ATTEMPTS=30
ATTEMPT=0
while ! curl -s http://localhost:3000 > /dev/null 2>&1; do
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Client failed to start after ${MAX_ATTEMPTS} attempts${NC}"
        kill $CLIENT_PID 2>/dev/null || true
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    echo -e "${YELLOW}   Waiting for client... (${ATTEMPT}/${MAX_ATTEMPTS})${NC}"
    sleep 2
done
echo -e "${GREEN}✅ Frontend client is running (PID: $CLIENT_PID)${NC}"
echo ""

# Step 8: Open browser
echo -e "${CYAN}[8/8] Opening browser...${NC}"
if command -v open > /dev/null 2>&1; then
    # macOS
    open http://localhost:3000
elif command -v xdg-open > /dev/null 2>&1; then
    # Linux
    xdg-open http://localhost:3000
elif command -v start > /dev/null 2>&1; then
    # Windows
    start http://localhost:3000
else
    echo -e "${YELLOW}⚠️  Could not open browser automatically${NC}"
    echo -e "${YELLOW}   Please open: http://localhost:3000${NC}"
fi
echo -e "${GREEN}✅ Browser opened${NC}"
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Setup Complete! All services are running                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 Frontend:${NC}  http://localhost:3000"
echo -e "${GREEN}🔌 Backend:${NC}   http://localhost:3001"
echo -e "${GREEN}🗄️  Database:${NC}  localhost:5432"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🔑 ADMIN CREDENTIALS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "Email:    ${GREEN}admin@react-super-app.local${NC}"
echo -e "Password: ${GREEN}Admin123!${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📋 MANUAL TESTING STEPS:${NC}"
echo ""
echo -e "${GREEN}1. Register a new user:${NC}"
echo -e "   • Click 'Login/Register'"
echo -e "   • Switch to 'Register' mode"
echo -e "   • Name: Test User"
echo -e "   • Email: test@example.com"
echo -e "   • Password: Test123!@#"
echo -e "   • Click 'Register'"
echo ""
echo -e "${GREEN}2. Logout:${NC}"
echo -e "   • Click 'Profile' → 'Logout'"
echo ""
echo -e "${GREEN}3. Login as regular user:${NC}"
echo -e "   • Email: test@example.com"
echo -e "   • Password: Test123!@#"
echo -e "   • Verify NO 'Admin' link in navigation"
echo ""
echo -e "${GREEN}4. Logout again:${NC}"
echo -e "   • Click 'Profile' → 'Logout'"
echo ""
echo -e "${GREEN}5. Login as admin:${NC}"
echo -e "   • Email: admin@react-super-app.local"
echo -e "   • Password: Admin123!"
echo -e "   • Verify 'Admin' link appears (gold/bold)"
echo ""
echo -e "${GREEN}6. List users:${NC}"
echo -e "   • Click 'Admin' → 'User Management'"
echo -e "   • Verify both users are listed"
echo ""
echo -e "${GREEN}7. Update user password:${NC}"
echo -e "   • Click ✏️ next to 'Test User'"
echo -e "   • Scroll to 'Reset Password'"
echo -e "   • New Password: NewTest123!@#"
echo -e "   • Confirm Password: NewTest123!@#"
echo -e "   • Click 'Save Changes'"
echo -e "   • Enter admin password when prompted: Admin123!"
echo -e "   • Click 'Authenticate'"
echo ""
echo -e "${GREEN}8. Admin logout:${NC}"
echo -e "   • Click 'Profile' → 'Logout'"
echo ""
echo -e "${GREEN}9. Login with new password:${NC}"
echo -e "   • Email: test@example.com"
echo -e "   • Password: NewTest123!@#"
echo -e "   • Verify login succeeds"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}🛑 To stop all services:${NC}"
echo -e "   ${YELLOW}./scripts/stop-services.sh${NC}"
echo ""
echo -e "${CYAN}📖 For detailed testing guide:${NC}"
echo -e "   ${YELLOW}docs/ADMIN_TESTING_GUIDE.md${NC}"
echo ""
echo -e "${GREEN}Happy Testing! 🚀${NC}"
echo ""

