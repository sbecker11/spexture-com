#!/bin/bash

# Run database migration
# Usage: ./scripts/run-migration.sh [migration_number]
# Example: ./scripts/run-migration.sh 001

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_ROOT/server/database/migrations"

# Load environment variables from .env file if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Database connection details
DB_USER="${SPEXTURE_POSTGRES_USER:-spexture_user}"
DB_PASSWORD="${SPEXTURE_POSTGRES_PASSWORD:-spexture_password}"
DB_NAME="${SPEXTURE_POSTGRES_DB:-spexture_com}"
DB_HOST="${SPEXTURE_DB_HOST:-localhost}"
DB_PORT="${SPEXTURE_POSTGRES_PORT:-5433}"

echo -e "${BLUE}=== Spexture-com - Database Migration Tool ===${NC}"
echo ""

# Check if migration number provided
MIGRATION_NUM="${1:-001}"
MIGRATION_FILE="$MIGRATIONS_DIR/${MIGRATION_NUM}_*.sql"

# Find migration file
MIGRATION_PATH=$(ls $MIGRATION_FILE 2>/dev/null | head -n 1)

if [ -z "$MIGRATION_PATH" ]; then
    echo -e "${RED}❌ Error: Migration file not found: $MIGRATION_FILE${NC}"
    echo ""
    echo "Available migrations:"
    ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null || echo "  (none found)"
    exit 1
fi

echo -e "${YELLOW}📄 Migration file: $(basename "$MIGRATION_PATH")${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Check if database container is running
if ! docker ps | grep -q spexture_com_postgres; then
    echo -e "${YELLOW}⚠️  Database container not running${NC}"
    echo "Starting database container..."
    cd "$PROJECT_ROOT"
    docker compose up -d postgres
    echo "Waiting for database to be ready..."
    sleep 5
fi

# Get the superuser from container environment (POSTGRES_USER)
# When POSTGRES_USER is set, that user is the superuser (not 'postgres')
SUPERUSER=$(docker exec spexture_com_postgres printenv POSTGRES_USER 2>/dev/null || echo "")

# Get the default database name (POSTGRES_DB or fallback to postgres)
# When POSTGRES_USER is set, PostgreSQL creates a database with POSTGRES_DB name
DEFAULT_DB=$(docker exec spexture_com_postgres printenv POSTGRES_DB 2>/dev/null || echo "")

# If POSTGRES_USER is set, use it as superuser and POSTGRES_DB as default database
# Otherwise, fall back to 'postgres' user and 'postgres' database
if [ -z "$SUPERUSER" ]; then
    SUPERUSER="postgres"
    DEFAULT_DB="postgres"
else
    # POSTGRES_USER is set, so use it and POSTGRES_DB
    # If POSTGRES_DB is not set, use the username as database name
    if [ -z "$DEFAULT_DB" ]; then
        DEFAULT_DB="$SUPERUSER"
    fi
fi

# Check if user exists, create if not
echo -e "${BLUE}👤 Checking database user...${NC}"

# If the superuser is the same as DB_USER, the user already exists (created by PostgreSQL)
if [ "$SUPERUSER" = "$DB_USER" ]; then
    echo -e "${GREEN}✅ User '$DB_USER' exists (superuser)${NC}"
else
    USER_EXISTS=$(docker exec spexture_com_postgres psql -U "$SUPERUSER" -d "$DEFAULT_DB" -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null || echo "0")
    
    if [ "$USER_EXISTS" != "1" ]; then
        echo -e "${YELLOW}⚠️  User '$DB_USER' does not exist. Creating...${NC}"
        docker exec -i spexture_com_postgres psql -U "$SUPERUSER" -d "$DEFAULT_DB" <<EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
ALTER USER $DB_USER CREATEDB;
EOF
        echo -e "${GREEN}✅ User '$DB_USER' created${NC}"
    else
        echo -e "${GREEN}✅ User '$DB_USER' exists${NC}"
    fi
fi

# Check if database exists, create if not
echo -e "${BLUE}📦 Checking database...${NC}"

# If the default database is the same as DB_NAME, the database already exists (created by PostgreSQL)
if [ "$DEFAULT_DB" = "$DB_NAME" ]; then
    echo -e "${GREEN}✅ Database '$DB_NAME' exists (default database)${NC}"
else
    DB_EXISTS=$(docker exec spexture_com_postgres psql -U "$SUPERUSER" -d "$DEFAULT_DB" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")
    
    if [ "$DB_EXISTS" != "1" ]; then
        echo -e "${YELLOW}⚠️  Database '$DB_NAME' does not exist. Creating...${NC}"
        docker exec -i spexture_com_postgres psql -U "$SUPERUSER" -d "$DEFAULT_DB" <<EOF
CREATE DATABASE $DB_NAME OWNER $DB_USER;
EOF
        echo -e "${GREEN}✅ Database '$DB_NAME' created${NC}"
    else
        echo -e "${GREEN}✅ Database '$DB_NAME' exists${NC}"
    fi
fi

# Test database connection
echo -e "${BLUE}🔌 Testing database connection...${NC}"
if ! docker exec spexture_com_postgres pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Cannot connect to database${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database connection successful${NC}"
echo ""

# Create migrations tracking table if it doesn't exist
echo -e "${BLUE}📊 Checking migrations tracking table...${NC}"
# Use SUPERUSER to create the table, then grant permissions to DB_USER
docker exec -i spexture_com_postgres psql -U "$SUPERUSER" -d "$DB_NAME" <<EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_number VARCHAR(10) NOT NULL UNIQUE,
    migration_name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100) DEFAULT CURRENT_USER
);
EOF

# Check if migration already applied
ALREADY_APPLIED=$(docker exec -i spexture_com_postgres psql -U "$SUPERUSER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM schema_migrations WHERE migration_number = '$MIGRATION_NUM';")

if [ "$ALREADY_APPLIED" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Migration $MIGRATION_NUM already applied${NC}"
    read -p "Do you want to re-run it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Migration cancelled."
        exit 0
    fi
    echo -e "${YELLOW}Re-running migration...${NC}"
fi

# Generate admin password hash
echo -e "${BLUE}🔐 Generating admin password hash...${NC}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin123!}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@spexture-com.local}"

# Use Node.js to generate bcrypt hash
ADMIN_HASH=$(cd "$PROJECT_ROOT/server" && node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('$ADMIN_PASSWORD', 10, (err, hash) => {
    if (err) {
        console.error('Error generating hash:', err);
        process.exit(1);
    }
    console.log(hash);
});
")

if [ -z "$ADMIN_HASH" ]; then
    echo -e "${RED}❌ Error: Failed to generate password hash${NC}"
    echo "Make sure bcryptjs is installed: cd server && npm install bcryptjs"
    exit 1
fi

# Replace placeholder hash in migration file
TEMP_MIGRATION=$(mktemp)
sed "s|\$2b\$10\$rZ5LkH8K8xJQK5Y5K5Y5K5Y5K5Y5K5Y5K5Y5K5Y5K5Y5K5Y5K5Y5K|$ADMIN_HASH|g" "$MIGRATION_PATH" > "$TEMP_MIGRATION"

# Run migration
echo -e "${BLUE}🚀 Running migration...${NC}"
echo ""

if docker exec -i spexture_com_postgres psql -U "$SUPERUSER" -d "$DB_NAME" < "$TEMP_MIGRATION"; then
    echo ""
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
    
    # Record migration
    MIGRATION_NAME=$(basename "$MIGRATION_PATH" .sql | cut -d'_' -f2-)
    docker exec -i spexture_com_postgres psql -U "$SUPERUSER" -d "$DB_NAME" <<EOF
INSERT INTO schema_migrations (migration_number, migration_name)
VALUES ('$MIGRATION_NUM', '$MIGRATION_NAME')
ON CONFLICT (migration_number) DO UPDATE
SET applied_at = CURRENT_TIMESTAMP;
EOF
    
    echo ""
    echo -e "${GREEN}📝 Migration recorded in schema_migrations table${NC}"
    
    # Show admin credentials if this was the RBAC migration
    if [[ "$MIGRATION_PATH" == *"rbac"* ]]; then
        echo ""
        echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
        echo -e "${YELLOW}🔑 ADMIN CREDENTIALS (save these securely!)${NC}"
        echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
        echo -e "Email:    ${GREEN}$ADMIN_EMAIL${NC}"
        echo -e "Password: ${GREEN}$ADMIN_PASSWORD${NC}"
        echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
        echo -e "${RED}⚠️  IMPORTANT: Change this password after first login!${NC}"
        echo ""
    fi
    
else
    echo ""
    echo -e "${RED}❌ Migration failed!${NC}"
    rm -f "$TEMP_MIGRATION"
    exit 1
fi

# Clean up temp file
rm -f "$TEMP_MIGRATION"

# Show applied migrations
echo ""
echo -e "${BLUE}📋 Applied migrations:${NC}"
docker exec -i spexture_com_postgres psql -U "$SUPERUSER" -d "$DB_NAME" -c \
    "SELECT migration_number, migration_name, applied_at FROM schema_migrations ORDER BY applied_at;"

echo ""
echo -e "${GREEN}✨ All done!${NC}"

