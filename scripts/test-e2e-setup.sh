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

# Function to find or create a named iTerm2 window
# Usage: start_in_named_window "window_name" "command" "working_directory"
start_in_named_window() {
    local WINDOW_NAME="$1"
    local COMMAND="$2"
    local WORK_DIR="$3"
    
    # Check if running on macOS
    if [[ "$(uname)" != "Darwin" ]]; then
        echo -e "${YELLOW}⚠️  Named windows only available on macOS. Running in background instead.${NC}"
        cd "$WORK_DIR"
        eval "$COMMAND" > /dev/null 2>&1 &
        echo $! > "$PROJECT_ROOT/.${WINDOW_NAME}.pid"
        return 0
    fi
    
    # Escape single quotes in the command and directory for AppleScript
    local ESCAPED_COMMAND=$(echo "$COMMAND" | sed "s/'/''/g")
    local ESCAPED_WORK_DIR=$(echo "$WORK_DIR" | sed "s/'/''/g")
    local ESCAPED_WINDOW_NAME=$(echo "$WINDOW_NAME" | sed "s/'/''/g")
    
    # Use AppleScript to find or create named window
    # Suppress errors from tab naming (non-critical feature)
    osascript 2>/dev/null <<EOF || true
tell application "iTerm"
    activate
    
    set windowFound to false
    set targetWindow to missing value
    set targetTab to missing value
    set windowNameToFind to "$ESCAPED_WINDOW_NAME"
    
    -- Try to find existing window by checking tab names
    repeat with aWindow in windows
        try
            repeat with aTab in tabs of aWindow
                try
                    set tabName to name of aTab
                    if tabName is windowNameToFind then
                        set targetWindow to aWindow
                        set targetTab to aTab
                        set windowFound to true
                        exit repeat
                    end if
                on error
                    -- Skip tabs that can't be accessed
                end try
            end repeat
            if windowFound then exit repeat
        on error
            -- Skip windows that can't be accessed
        end try
    end repeat
    
    -- If not found, create new window
    if not windowFound then
        set targetWindow to (create window with default profile)
        set targetTab to current tab of targetWindow
    end if
    
    -- Set the tab name (non-critical, continue if it fails)
    try
        if targetTab is not missing value then
            set name of targetTab to windowNameToFind
        else
            set name of current tab of targetWindow to windowNameToFind
        end if
    on error
        -- Tab naming failed, but continue anyway (non-critical)
    end try
    
    -- Get the current session and run the command
    tell targetWindow
        tell current session of targetTab
            write text "cd '$ESCAPED_WORK_DIR'"
            write text "$ESCAPED_COMMAND"
        end tell
    end tell
end tell
EOF
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Spexture-com - End-to-End Testing Setup               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if containers already exist and are running
CONTAINERS_EXIST=false
if docker ps -a --format '{{.Names}}' | grep -q "spexture_com_postgres"; then
    CONTAINERS_EXIST=true
fi

# Interactive prompt for cleanup level
echo -e "${YELLOW}Choose setup option:${NC}"
echo -e "  ${GREEN}1)${NC} Quick start (keep database data, rebuild images)"
echo -e "  ${GREEN}2)${NC} Fresh start (remove everything, start from scratch)"

# Only show skip option if containers exist
if [ "$CONTAINERS_EXIST" = true ]; then
    echo -e "  ${GREEN}3)${NC} Use existing containers (skip cleanup)"
    MAX_CHOICE=3
else
    MAX_CHOICE=2
fi
echo ""
read -p "Enter choice [1-${MAX_CHOICE}] (default: 1): " -n 1 -r CLEANUP_CHOICE
echo ""
echo ""

# Set default if no choice
if [ -z "$CLEANUP_CHOICE" ]; then
    CLEANUP_CHOICE="1"
fi

# Validate choice
if [[ ! "$CLEANUP_CHOICE" =~ ^[1-${MAX_CHOICE}]$ ]]; then
    echo -e "${RED}Invalid choice. Using default (1).${NC}"
    CLEANUP_CHOICE="1"
fi

CLEAN_VOLUMES=false
CLEAN_IMAGES=true
SKIP_CLEANUP=false

case $CLEANUP_CHOICE in
    1)
        echo -e "${CYAN}→ Quick start: Keeping database data, rebuilding images${NC}"
        CLEAN_VOLUMES=false
        CLEAN_IMAGES=true
        ;;
    2)
        echo -e "${CYAN}→ Fresh start: Removing all Docker resources${NC}"
        CLEAN_VOLUMES=true
        CLEAN_IMAGES=true
        ;;
    3)
        if [ "$CONTAINERS_EXIST" = true ]; then
            echo -e "${CYAN}→ Using existing containers (skip cleanup)${NC}"
            SKIP_CLEANUP=true
        else
            echo -e "${RED}❌ Invalid choice: Containers don't exist${NC}"
            echo ""
            echo -e "${YELLOW}To use option 3 (Use existing containers), you must first:${NC}"
            echo -e "  ${GREEN}1)${NC} Run option 1 or 2 to create containers"
            echo -e "  ${GREEN}2)${NC} Ensure containers are running: ${CYAN}docker compose ps${NC}"
            echo ""
            echo -e "${YELLOW}Using default option 1 (Quick start) instead...${NC}"
            CLEANUP_CHOICE="1"
            CLEAN_VOLUMES=false
            CLEAN_IMAGES=true
        fi
        ;;
esac
echo ""

# Step 1: Check Docker Desktop
echo -e "${CYAN}[1/8] Checking Docker Desktop...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo ""
    echo -e "${YELLOW}Before running this script, ensure:${NC}"
    echo -e "  ${GREEN}1)${NC} Docker Desktop is installed and started"
    echo -e "  ${GREEN}2)${NC} Docker Desktop is fully running (not just starting)"
    echo -e "  ${GREEN}3)${NC} Verify Docker is ready: ${CYAN}docker info${NC}"
    echo ""
    echo -e "${YELLOW}To start Docker Desktop:${NC}"
    echo -e "  ${CYAN}• macOS:${NC} Open Docker Desktop from Applications"
    echo -e "  ${CYAN}• Windows:${NC} Open Docker Desktop from Start Menu"
    echo -e "  ${CYAN}• Linux:${NC} Start Docker service: ${CYAN}sudo systemctl start docker${NC}"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Docker Desktop is running${NC}"
echo ""

# Step 2: Check for port conflicts
echo -e "${CYAN}[2/7] Checking for port conflicts...${NC}"

# Load environment variables to get correct ports
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi
POSTGRES_PORT=${SPEXTURE_POSTGRES_PORT:-5433}
SERVER_PORT=${SPEXTURE_SERVER_PORT:-3011}
CLIENT_PORT=${SPEXTURE_CLIENT_PORT:-3010}

# Check if port 5433 (spexture-com PostgreSQL) is in use
if lsof -Pi :${POSTGRES_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port ${POSTGRES_PORT} (PostgreSQL) is already in use${NC}"
    
    # Check if it's a Docker container
    CONTAINER_ON_PORT=$(docker ps -q --filter "publish=${POSTGRES_PORT}" 2>/dev/null || true)
    if [ -n "$CONTAINER_ON_PORT" ]; then
        echo -e "${YELLOW}   Stopping Docker container on port ${POSTGRES_PORT}...${NC}"
        docker stop $CONTAINER_ON_PORT > /dev/null 2>&1 || true
        docker rm $CONTAINER_ON_PORT > /dev/null 2>&1 || true
    else
        echo -e "${RED}❌ Port ${POSTGRES_PORT} is in use by a non-Docker process${NC}"
        echo ""
        echo -e "${YELLOW}Before starting the database, ensure:${NC}"
        echo -e "  ${GREEN}1)${NC} Port ${POSTGRES_PORT} is free: ${CYAN}lsof -i :${POSTGRES_PORT}${NC}"
        echo -e "  ${GREEN}2)${NC} Stop conflicting process or use different port: ${CYAN}export POSTGRES_PORT=5434${NC}"
        echo -e "  ${GREEN}3)${NC} Check for other PostgreSQL instances: ${CYAN}ps aux | grep postgres${NC}"
        echo ""
        exit 1
    fi
fi

# Check if port 3011 (spexture-com server) is in use
if lsof -Pi :${SERVER_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port ${SERVER_PORT} (server) is in use. Killing process...${NC}"
    kill -9 $(lsof -t -i:${SERVER_PORT}) 2>/dev/null || true
    sleep 1
fi

# Check if port 3010 (spexture-com client) is in use
if lsof -Pi :${CLIENT_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port ${CLIENT_PORT} (client) is in use. Killing process...${NC}"
    kill -9 $(lsof -t -i:${CLIENT_PORT}) 2>/dev/null || true
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
        docker images | grep "spexture-com" | awk '{print $3}' | xargs -r docker rmi -f > /dev/null 2>&1 || true
        docker images | grep "spexture_com" | awk '{print $3}' | xargs -r docker rmi -f > /dev/null 2>&1 || true
    fi

    # Remove volumes if requested
    if [ "$CLEAN_VOLUMES" = true ]; then
        echo -e "${YELLOW}   Removing volumes (fresh database)...${NC}"
        docker volume rm spexture_com_postgres_data > /dev/null 2>&1 || true
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
while ! docker exec spexture_com_postgres pg_isready -U spexture_user -d spexture_com > /dev/null 2>&1; do
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Database failed to start after ${MAX_ATTEMPTS} attempts${NC}"
        echo ""
        echo -e "${YELLOW}Before running this option, ensure:${NC}"
        echo -e "  ${GREEN}1)${NC} Docker Desktop is running: ${CYAN}docker info${NC}"
        echo -e "  ${GREEN}2)${NC} Port ${POSTGRES_PORT} is available: ${CYAN}lsof -i :${POSTGRES_PORT}${NC}"
        echo -e "  ${GREEN}3)${NC} No conflicting containers: ${CYAN}docker ps -a | grep postgres${NC}"
        echo -e "  ${GREEN}4)${NC} Try option 2 (Fresh start) to remove old containers/volumes"
        echo ""
        exit 1
    fi
    echo -e "${YELLOW}   Waiting... (${ATTEMPT}/${MAX_ATTEMPTS})${NC}"
    sleep 2
done
echo -e "${GREEN}✅ Database is ready${NC}"
echo ""

# Step 5: Run database migration
echo -e "${CYAN}[5/8] Running database migration...${NC}"
if ! "$SCRIPT_DIR/run-migration.sh" 001; then
    echo ""
    echo -e "${RED}❌ Database migration failed${NC}"
    echo ""
    echo -e "${YELLOW}Before running migrations, ensure:${NC}"
    echo -e "  ${GREEN}1)${NC} Database container is running: ${CYAN}docker ps | grep spexture_com_postgres${NC}"
    echo -e "  ${GREEN}2)${NC} Database is initialized: ${CYAN}npm run db:init${NC}"
    echo -e "  ${GREEN}3)${NC} Database user exists: ${CYAN}docker exec spexture_com_postgres psql -U spexture_user -d spexture_com -c '\\du'${NC}"
    echo -e "  ${GREEN}4)${NC} Migration file exists: ${CYAN}ls server/database/migrations/${NC}"
    echo ""
    exit 1
fi
echo ""

# Step 6: Start backend server
echo -e "${CYAN}[6/8] Starting backend server...${NC}"
cd "$PROJECT_ROOT/server"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⏳ Installing server dependencies...${NC}"
    npm install
fi

# Check if server is already running
if lsof -Pi :${SERVER_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port ${SERVER_PORT} is already in use. Killing existing process...${NC}"
    kill -9 $(lsof -t -i:${SERVER_PORT}) 2>/dev/null || true
    sleep 2
fi

echo -e "${YELLOW}⏳ Starting server on port ${SERVER_PORT} in iTerm2 window 'spexture-com:server:${SERVER_PORT}'...${NC}"
start_in_named_window "spexture-com:server:${SERVER_PORT}" "PORT=${SERVER_PORT} npm start" "$PROJECT_ROOT/server"

# Wait for server to be ready
sleep 3
MAX_ATTEMPTS=20
ATTEMPT=0
while ! curl -s http://localhost:${SERVER_PORT}/health > /dev/null 2>&1; do
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Server failed to start after ${MAX_ATTEMPTS} attempts${NC}"
        echo ""
        echo -e "${YELLOW}Before starting the server, ensure:${NC}"
        echo -e "  ${GREEN}1)${NC} Database is running and ready: ${CYAN}docker ps | grep spexture_com_postgres${NC}"
        echo -e "  ${GREEN}2)${NC} Database migration completed successfully (Step 5)"
        echo -e "  ${GREEN}3)${NC} Server dependencies installed: ${CYAN}cd server && npm install${NC}"
        echo -e "  ${GREEN}4)${NC} Port ${SERVER_PORT} is available: ${CYAN}lsof -i :${SERVER_PORT}${NC}"
        echo -e "  ${GREEN}5)${NC} Check server logs in iTerm2 window 'spexture-com:server:${SERVER_PORT}'"
        echo ""
        exit 1
    fi
    echo -e "${YELLOW}   Waiting for server... (${ATTEMPT}/${MAX_ATTEMPTS})${NC}"
    sleep 2
done
echo -e "${GREEN}✅ Backend server is running (check iTerm2 window 'spexture-com:server:${SERVER_PORT}')${NC}"
echo ""

# Step 7: Start frontend client
echo -e "${CYAN}[7/8] Starting frontend client...${NC}"
cd "$PROJECT_ROOT"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⏳ Installing client dependencies...${NC}"
    npm install
fi

# Check if client is already running
if lsof -Pi :${CLIENT_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port ${CLIENT_PORT} is already in use. Killing existing process...${NC}"
    kill -9 $(lsof -t -i:${CLIENT_PORT}) 2>/dev/null || true
    sleep 2
fi

echo -e "${YELLOW}⏳ Starting React app on port ${CLIENT_PORT} in iTerm2 window 'spexture-com:client:${CLIENT_PORT}'...${NC}"
start_in_named_window "spexture-com:client:${CLIENT_PORT}" "PORT=${CLIENT_PORT} SPEXTURE_APP_API_URL=http://localhost:${SERVER_PORT}/api BROWSER=none npm start" "$PROJECT_ROOT"

# Wait for client to be ready
sleep 5
MAX_ATTEMPTS=30
ATTEMPT=0
while ! curl -s http://localhost:${CLIENT_PORT} > /dev/null 2>&1; do
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Client failed to start after ${MAX_ATTEMPTS} attempts${NC}"
        echo ""
        echo -e "${YELLOW}Before starting the client, ensure:${NC}"
        echo -e "  ${GREEN}1)${NC} Backend server is running (Step 6 completed successfully)"
        echo -e "  ${GREEN}2)${NC} Client dependencies installed: ${CYAN}npm install${NC}"
        echo -e "  ${GREEN}3)${NC} Port ${CLIENT_PORT} is available: ${CYAN}lsof -i :${CLIENT_PORT}${NC}"
        echo -e "  ${GREEN}4)${NC} SPEXTURE_APP_API_URL is set correctly: ${CYAN}echo \$SPEXTURE_APP_API_URL${NC}"
        echo -e "  ${GREEN}5)${NC} Check client logs in iTerm2 window 'spexture-com:client:${CLIENT_PORT}'"
        echo ""
        exit 1
    fi
    echo -e "${YELLOW}   Waiting for client... (${ATTEMPT}/${MAX_ATTEMPTS})${NC}"
    sleep 2
done
echo -e "${GREEN}✅ Frontend client is running (check iTerm2 window 'spexture-com:client:${CLIENT_PORT}')${NC}"
echo ""

# Step 8: Open browser
echo -e "${CYAN}[8/8] Opening browser...${NC}"
if command -v open > /dev/null 2>&1; then
    # macOS
    open http://localhost:${CLIENT_PORT}
elif command -v xdg-open > /dev/null 2>&1; then
    # Linux
    xdg-open http://localhost:${CLIENT_PORT}
elif command -v start > /dev/null 2>&1; then
    # Windows
    start http://localhost:${CLIENT_PORT}
else
    echo -e "${YELLOW}⚠️  Could not open browser automatically${NC}"
    echo -e "${YELLOW}   Please open: http://localhost:${CLIENT_PORT}${NC}"
fi
echo -e "${GREEN}✅ Browser opened${NC}"
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Setup Complete! All services are running                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 Frontend:${NC}  http://localhost:${CLIENT_PORT}"
echo -e "${GREEN}🔌 Backend:${NC}   http://localhost:${SERVER_PORT}"
echo -e "${GREEN}🗄️  Database:${NC}  localhost:${POSTGRES_PORT}"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🔑 ADMIN CREDENTIALS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "Email:    ${GREEN}admin@spexture-com.local${NC}"
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
echo -e "   • Email: admin@spexture-com.local"
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

