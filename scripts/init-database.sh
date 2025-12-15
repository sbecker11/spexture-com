#!/bin/bash

# Database Initialization Script
# This script starts PostgreSQL, waits for it to be ready, and initializes the database schema

set -e  # Exit on error

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

# Database configuration with defaults
POSTGRES_USER=${POSTGRES_USER:-superapp_user}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-superapp_password}
POSTGRES_DB=${POSTGRES_DB:-react_super_app}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
DB_HOST=${DB_HOST:-localhost}

# Source the port checker script
source "$SCRIPT_DIR/check-port.sh"

# Source the Docker initialization script
source "$SCRIPT_DIR/init-docker.sh"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Database Initialization Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""


# Function to check if PostgreSQL is ready
wait_for_postgres() {
    local docker_cmd=$1
    echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if $docker_cmd -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ PostgreSQL is ready!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}  Attempt $attempt/$max_attempts: Waiting...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}✗ PostgreSQL failed to become ready after $max_attempts attempts${NC}"
    return 1
}

# Function to check if a table exists
table_exists() {
    local docker_cmd=$1
    local table_name=$2
    $docker_cmd -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table_name');" | grep -q "t"
}

# Function to check if extension exists
extension_exists() {
    local docker_cmd=$1
    local ext_name=$2
    $docker_cmd -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
        "SELECT EXISTS (SELECT FROM pg_extension WHERE extname = '$ext_name');" | grep -q "t"
}

# Step 0: Initialize Docker
if ! init_docker; then
    echo -e "${YELLOW}Run this script again after starting Docker: ${BLUE}npm run db:init${NC}"
    exit 1
fi

# Step 0.5: Check docker-compose availability
if ! check_docker_compose; then
    exit 1
fi

# Step 0.5: Check if PostgreSQL port is available
echo ""
echo -e "${BLUE}Checking port availability...${NC}"
if ! check_port "$POSTGRES_PORT" "PostgreSQL"; then
    echo -e "${RED}✗ Cannot proceed with port conflict${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Port $POSTGRES_PORT is available${NC}"

# Step 1: Start PostgreSQL container
echo ""
echo -e "${BLUE}Step 1: Starting PostgreSQL container...${NC}"

# Check if container is already running
if $DOCKER_COMPOSE_CMD -f "$PROJECT_ROOT/docker-compose.yml" ps postgres 2>/dev/null | grep -q "Up"; then
    echo -e "${GREEN}✓ PostgreSQL container is already running${NC}"
else
    echo -e "${YELLOW}Starting PostgreSQL container...${NC}"
    $DOCKER_COMPOSE_CMD -f "$PROJECT_ROOT/docker-compose.yml" up -d postgres
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to start PostgreSQL container${NC}"
        echo -e "${YELLOW}Make sure Docker Desktop is fully started and try again${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ PostgreSQL container started${NC}"
fi

# Step 2: Wait for PostgreSQL to be ready
echo ""
echo -e "${BLUE}Step 2: Waiting for PostgreSQL to be ready...${NC}"
if ! wait_for_postgres "$DOCKER_COMPOSE_CMD"; then
    exit 1
fi

# Step 3: Check if database exists, create if not
echo ""
echo -e "${BLUE}Step 3: Checking database...${NC}"

DB_EXISTS=$($DOCKER_COMPOSE_CMD -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -w "$POSTGRES_DB" | wc -l)

if [ "$DB_EXISTS" -eq "0" ]; then
    echo -e "${YELLOW}Database '$POSTGRES_DB' does not exist. Creating...${NC}"
    $DOCKER_COMPOSE_CMD -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U "$POSTGRES_USER" -c "CREATE DATABASE $POSTGRES_DB;"
    echo -e "${GREEN}✓ Database '$POSTGRES_DB' created${NC}"
else
    echo -e "${GREEN}✓ Database '$POSTGRES_DB' already exists${NC}"
fi

# Step 4: Check if UUID extension exists, create if not
echo ""
echo -e "${BLUE}Step 4: Checking UUID extension...${NC}"

if extension_exists "$DOCKER_COMPOSE_CMD" "uuid-ossp"; then
    echo -e "${GREEN}✓ UUID extension already exists${NC}"
else
    echo -e "${YELLOW}Creating UUID extension...${NC}"
    $DOCKER_COMPOSE_CMD -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
    echo -e "${GREEN}✓ UUID extension created${NC}"
fi

# Step 5: Check if tables exist, initialize schema if needed
echo ""
echo -e "${BLUE}Step 5: Checking database schema...${NC}"

if table_exists "$DOCKER_COMPOSE_CMD" "users"; then
    echo -e "${GREEN}✓ Tables already exist${NC}"
    
    # Verify all expected tables exist
    if table_exists "$DOCKER_COMPOSE_CMD" "job_descriptions"; then
        echo -e "${GREEN}✓ All tables are present${NC}"
    else
        echo -e "${YELLOW}⚠ Some tables are missing. Running initialization...${NC}"
        $DOCKER_COMPOSE_CMD -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/init.sql
        echo -e "${GREEN}✓ Schema initialized${NC}"
    fi
else
    echo -e "${YELLOW}Tables do not exist. Initializing schema...${NC}"
    
    # Run the init.sql script
    if [ -f "$PROJECT_ROOT/server/database/init.sql" ]; then
        echo -e "${YELLOW}Running initialization script...${NC}"
        
        # Copy SQL file into container and run it (bypasses file sharing requirement)
        echo -e "${YELLOW}Copying SQL file into container...${NC}"
        $DOCKER_COMPOSE_CMD -f "$PROJECT_ROOT/docker-compose.yml" cp "$PROJECT_ROOT/server/database/init.sql" postgres:/tmp/init.sql
        
        # Run the SQL file from inside the container
        $DOCKER_COMPOSE_CMD -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /tmp/init.sql
        
        echo -e "${GREEN}✓ Schema initialized successfully${NC}"
    else
        echo -e "${RED}✗ Initialization script not found at: $PROJECT_ROOT/server/database/init.sql${NC}"
        exit 1
    fi
fi

# Step 6: Verify tables
echo ""
echo -e "${BLUE}Step 6: Verifying database schema...${NC}"

TABLES=("users" "job_descriptions")
ALL_TABLES_EXIST=true

for table in "${TABLES[@]}"; do
    if table_exists "$DOCKER_COMPOSE_CMD" "$table"; then
        echo -e "${GREEN}✓ Table '$table' exists${NC}"
    else
        echo -e "${RED}✗ Table '$table' is missing${NC}"
        ALL_TABLES_EXIST=false
    fi
done

if [ "$ALL_TABLES_EXIST" = false ]; then
    echo -e "${RED}✗ Some tables are missing. Please check the initialization script.${NC}"
    exit 1
fi

# Step 7: Check indexes
echo ""
echo -e "${BLUE}Step 7: Verifying indexes...${NC}"

INDEXES=$($DOCKER_COMPOSE_CMD -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
    "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('users', 'job_descriptions');")

if [ "$INDEXES" -gt "0" ]; then
    echo -e "${GREEN}✓ Indexes are present ($INDEXES found)${NC}"
else
    echo -e "${YELLOW}⚠ No indexes found (this may be normal if they haven't been created yet)${NC}"
fi

# Step 8: Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Database Initialization Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Database: ${GREEN}$POSTGRES_DB${NC}"
echo -e "User: ${GREEN}$POSTGRES_USER${NC}"
echo -e "Host: ${GREEN}$DB_HOST${NC}"
echo -e "Port: ${GREEN}$POSTGRES_PORT${NC}"
echo ""
echo -e "${BLUE}Connection string:${NC}"
echo -e "  postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$DB_HOST:$POSTGRES_PORT/$POSTGRES_DB"
echo ""
echo -e "${BLUE}To connect manually:${NC}"
echo -e "  $DOCKER_COMPOSE_CMD exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB"
echo ""

