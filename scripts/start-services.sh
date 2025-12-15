#!/bin/bash

# Start Services Script with Port Checking
# Checks all ports before starting docker-compose services

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${BLUE}Preparing to start all services...${NC}"
echo ""

# Check ports first
if ! "$SCRIPT_DIR/check-ports.sh"; then
    echo ""
    echo "Port check failed. Please resolve port conflicts before continuing."
    exit 1
fi

echo ""
echo -e "${GREEN}Starting all services with docker compose...${NC}"
echo ""

# Run docker compose with the provided arguments
cd "$PROJECT_ROOT"
docker compose "$@"

