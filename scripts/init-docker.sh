#!/bin/bash

# Docker Initialization Script
# This script provides Docker checking and starting functionality
# Used by other scripts to ensure Docker is available before proceeding

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Function to check if Docker is running
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker is not installed${NC}"
        echo -e "${YELLOW}Please install Docker Desktop from: https://www.docker.com/get-started${NC}"
        return 1
    fi

    if ! docker info > /dev/null 2>&1; then
        echo -e "${YELLOW}Docker daemon is not running${NC}"
        return 2
    fi

    return 0
}

# Function to start Docker Desktop on macOS
start_docker_desktop() {
    local os_type=$(uname -s)

    if [ "$os_type" != "Darwin" ]; then
        echo -e "${YELLOW}Note: Docker startup automation is only available on macOS${NC}"
        return 1
    fi

    echo -e "${YELLOW}Attempting to start Docker Desktop...${NC}"

    # Try to start Docker Desktop using open command
    if open -a Docker > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Docker Desktop launch command sent${NC}"
        echo -e "${YELLOW}Waiting for Docker Desktop to start (this may take 30-60 seconds)...${NC}"

        # Wait for Docker to become available
        local max_wait=60
        local wait_time=0

        while [ $wait_time -lt $max_wait ]; do
            if docker info > /dev/null 2>&1; then
                echo -e "${GREEN}✓ Docker Desktop is now running!${NC}"
                return 0
            fi

            sleep 2
            wait_time=$((wait_time + 2))
            echo -e "${YELLOW}  Waiting... ($wait_time/$max_wait seconds)${NC}"
        done

        echo -e "${RED}✗ Docker Desktop did not start within $max_wait seconds${NC}"
        echo -e "${YELLOW}Please start Docker Desktop manually and try again${NC}"
        return 1
    else
        echo -e "${RED}✗ Failed to launch Docker Desktop${NC}"
        echo -e "${YELLOW}Please start Docker Desktop manually and try again${NC}"
        return 1
    fi
}

# Function to initialize Docker (main entry point)
init_docker() {
    echo -e "${BLUE}Step 0: Checking Docker...${NC}"

    DOCKER_CHECK_RESULT=$(check_docker)
    DOCKER_CHECK_EXIT=$?

    if [ $DOCKER_CHECK_EXIT -eq 1 ]; then
        # Docker not installed
        return 1
    elif [ $DOCKER_CHECK_EXIT -eq 2 ]; then
        # Docker daemon not running - try to start it
        echo ""
        if start_docker_desktop; then
            echo -e "${GREEN}✓ Docker is now running${NC}"
            return 0
        else
            echo ""
            echo -e "${RED}✗ Cannot proceed without Docker${NC}"
            echo ""
            echo -e "${YELLOW}To start Docker Desktop manually:${NC}"
            echo -e "  1. Open Docker Desktop application"
            echo -e "  2. Wait for it to fully start (whale icon in menu bar)"
            echo -e "  3. Run the script again"
            echo ""
            return 1
        fi
    else
        echo -e "${GREEN}✓ Docker is running${NC}"
        return 0
    fi
}

# Function to verify docker-compose is available
check_docker_compose() {
    if docker compose version > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Using: docker compose${NC}"
        DOCKER_COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}✓ Using: docker-compose${NC}"
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        echo -e "${RED}✗ docker-compose is not available${NC}"
        echo -e "${YELLOW}Please install Docker Compose (comes with Docker Desktop)${NC}"
        return 1
    fi

    export DOCKER_COMPOSE_CMD
    return 0
}

# Export functions for use by other scripts
export -f check_docker
export -f start_docker_desktop
export -f init_docker
export -f check_docker_compose
