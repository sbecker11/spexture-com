#!/bin/bash

# Clean Docker - Remove all React Super App Docker resources
# Use this for a completely fresh start

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
echo -e "${BLUE}║  React Super App - Docker Cleanup                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will remove ALL Docker resources for this project${NC}"
echo -e "${YELLOW}   including containers, images, volumes, and networks.${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${GREEN}Cleanup cancelled.${NC}"
    exit 0
fi

cd "$PROJECT_ROOT"

# Step 1: Stop and remove containers
echo -e "${CYAN}[1/5] Stopping and removing containers...${NC}"
docker compose down 2>/dev/null || true
echo -e "${GREEN}✅ Containers removed${NC}"
echo ""

# Step 2: Remove images
echo -e "${CYAN}[2/5] Removing images...${NC}"
IMAGES=$(docker images | grep -E "react-super-app|react_super_app" | awk '{print $3}' || true)
if [ -n "$IMAGES" ]; then
    echo "$IMAGES" | xargs docker rmi -f 2>/dev/null || true
    echo -e "${GREEN}✅ Images removed${NC}"
else
    echo -e "${YELLOW}⚠️  No images found${NC}"
fi
echo ""

# Step 3: Remove volumes
echo -e "${CYAN}[3/5] Removing volumes...${NC}"
VOLUMES=$(docker volume ls | grep -E "react-super-app|react_super_app" | awk '{print $2}' || true)
if [ -n "$VOLUMES" ]; then
    echo "$VOLUMES" | xargs docker volume rm -f 2>/dev/null || true
    echo -e "${GREEN}✅ Volumes removed${NC}"
else
    echo -e "${YELLOW}⚠️  No volumes found${NC}"
fi
echo ""

# Step 4: Remove networks
echo -e "${CYAN}[4/5] Removing networks...${NC}"
NETWORKS=$(docker network ls | grep -E "react-super-app|react_super_app" | awk '{print $2}' || true)
if [ -n "$NETWORKS" ]; then
    echo "$NETWORKS" | xargs docker network rm 2>/dev/null || true
    echo -e "${GREEN}✅ Networks removed${NC}"
else
    echo -e "${YELLOW}⚠️  No networks found${NC}"
fi
echo ""

# Step 5: Clean up dangling resources
echo -e "${CYAN}[5/5] Cleaning up dangling resources...${NC}"
docker system prune -f > /dev/null 2>&1 || true
echo -e "${GREEN}✅ Dangling resources cleaned${NC}"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Docker Cleanup Complete!                                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}All React Super App Docker resources have been removed.${NC}"
echo ""
echo -e "${CYAN}To start fresh:${NC}"
echo -e "   ${YELLOW}npm run test:e2e${NC}"
echo ""

