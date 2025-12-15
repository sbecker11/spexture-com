#!/bin/bash

# Port Checker Script for All Services
# Checks all required ports before starting services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables from .env file if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Source the port checker function
source "$SCRIPT_DIR/check-port.sh"

# Port configuration with defaults
CLIENT_PORT=${CLIENT_PORT:-3000}
SERVER_PORT=${SERVER_PORT:-3001}
POSTGRES_PORT=${POSTGRES_PORT:-5433}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Port Availability Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

PORTS_TO_CHECK=(
    "$CLIENT_PORT:React Client"
    "$SERVER_PORT:Express API Server"
    "$POSTGRES_PORT:PostgreSQL Database"
)

FAILED_PORTS=()

for port_info in "${PORTS_TO_CHECK[@]}"; do
    IFS=':' read -r port service <<< "$port_info"
    
    echo -e "${BLUE}Checking port $port ($service)...${NC}"
    
    if ! check_port "$port" "$service"; then
        FAILED_PORTS+=("$port:$service")
        echo ""
    else
        echo -e "${GREEN}✓ Port $port is available${NC}"
        echo ""
    fi
done

# Summary
if [ ${#FAILED_PORTS[@]} -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}All ports are available!${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 0
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}Some ports are still in use:${NC}"
    for port_info in "${FAILED_PORTS[@]}"; do
        IFS=':' read -r port service <<< "$port_info"
        echo -e "${RED}  - Port $port ($service)${NC}"
    done
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Please free these ports and try again.${NC}"
    exit 1
fi

