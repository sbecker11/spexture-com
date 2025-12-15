#!/bin/bash

# React Super App - 4-Terminal Development Setup
# Opens iTerm2 window with 4 panes (tabs) with different background colors:
# Top-left: Database (Cyan) | Top-right: Server (Green)
# Bottom-left: Client (Blue) | Bottom-right: Claude (Purple)
#
# SETUP: Create 4 color profiles in iTerm2 first:
# 1. Duplicate your default profile 4 times
# 2. Name them: "Database", "Server", "Client", "Claude"
# 3. Set background colors: Cyan, Green, Blue, Purple (or your preference)
# 4. Run this script

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up 4-terminal development environment...${NC}"

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Profile names (user can customize these in iTerm2)
DB_PROFILE="Database"
SERVER_PROFILE="Server"
CLIENT_PROFILE="Client"
CLAUDE_PROFILE="Claude"

# Check if profiles exist (optional - will fall back to default if not found)
echo -e "${YELLOW}Note: For colored panes, create iTerm2 profiles named: $DB_PROFILE, $SERVER_PROFILE, $CLIENT_PROFILE, $CLAUDE_PROFILE${NC}"
echo ""

# Create iTerm2 AppleScript
osascript <<EOF
tell application "iTerm"
    activate

    -- Create new window with Database profile
    set newWindow to (create window with profile "$DB_PROFILE")
    tell newWindow
        tell current session
            -- Top-left pane: Database
            write text "cd '$PROJECT_ROOT'"
            write text "echo -e '${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}'"
            write text "echo -e '${CYAN}  Terminal 1: Database (PostgreSQL)${NC}'"
            write text "echo -e '${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}'"
            write text "echo ''"
            write text "echo 'Starting PostgreSQL in Docker...'"
            write text "npm run db:init"

            -- Split right: Server
            set serverPane to (split horizontally with profile "$SERVER_PROFILE")
        end tell

        tell serverPane
            write text "cd '$PROJECT_ROOT/server'"
            write text "echo -e '${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}'"
            write text "echo -e '${GREEN}  Terminal 2: Server (Express API)${NC}'"
            write text "echo -e '${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}'"
            write text "echo ''"
            write text "echo 'Waiting for database to be ready...'"
            write text "sleep 5"
            write text "echo 'Starting Express server with hot reload...'"
            write text "npm run dev"
        end tell

        tell current session
            -- Split bottom: Client
            set clientPane to (split vertically with profile "$CLIENT_PROFILE")
        end tell

        tell clientPane
            write text "cd '$PROJECT_ROOT'"
            write text "echo -e '${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}'"
            write text "echo -e '${BLUE}  Terminal 3: Client (React App)${NC}'"
            write text "echo -e '${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}'"
            write text "echo ''"
            write text "echo 'Waiting for server to be ready...'"
            write text "sleep 8"
            write text "echo 'Starting React dev server...'"
            write text "npm start"

            -- Split right: Claude
            set claudePane to (split horizontally with profile "$CLAUDE_PROFILE")
        end tell

        tell claudePane
            write text "cd '$PROJECT_ROOT'"
            write text "echo -e '${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}'"
            write text "echo -e '${PURPLE}  Terminal 4: Claude Code (AI Assistant)${NC}'"
            write text "echo -e '${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}'"
            write text "echo ''"
            write text "echo 'Welcome! I can help you with:'"
            write text "echo '  • Answering questions about the codebase'"
            write text "echo '  • Making code changes'"
            write text "echo '  • Running tests'"
            write text "echo '  • Debugging issues'"
            write text "echo '  • Generating documentation'"
            write text "echo ''"
            write text "echo 'Type your question or request below:'"
            write text "echo ''"
            write text "claude"
        end tell
    end tell
end tell
EOF

echo -e "${GREEN}✓ 4-terminal development environment ready!${NC}"
echo ""
echo -e "${CYAN}Terminal Layout:${NC}"
echo -e "  ${CYAN}Top-left:${NC}     Database (PostgreSQL in Docker)"
echo -e "  ${GREEN}Top-right:${NC}    Server (Express API with hot reload)"
echo -e "  ${BLUE}Bottom-left:${NC}  Client (React app with hot reload)"
echo -e "  ${PURPLE}Bottom-right:${NC} Claude Code (AI assistant)"
echo ""
echo -e "${GREEN}All terminals are starting up...${NC}"
echo -e "${GREEN}Give it 10-15 seconds for everything to be ready.${NC}"
echo ""
echo -e "${CYAN}Access URLs:${NC}"
echo -e "  • React Client: ${BLUE}http://localhost:3000${NC}"
echo -e "  • Express API:  ${GREEN}http://localhost:3001${NC}"
echo -e "  • Database:     ${CYAN}localhost:5432${NC}"
