# 📜 Scripts Directory

Utility scripts for React Super App development, testing, and deployment.

---

## 🚀 Quick Reference

### Most Commonly Used

| Script | Command | Description |
|--------|---------|-------------|
| **dev-terminals.sh** | `./scripts/dev-terminals.sh` | 🎯 One-command 4-pane iTerm2 setup |
| **check-ports.sh** | `npm run check-ports` | Check if ports 3000, 3001, 5432 are available |
| **init-database.sh** | `npm run db:init` | Initialize PostgreSQL database |
| **start-services.sh** | `npm run start:services` | Start all Docker services |
| **test-e2e-setup.sh** | `npm run test:e2e` | Run full E2E test suite |

---

## 📋 All Scripts

### Development (3 scripts)
- **dev-terminals.sh** - 4-pane iTerm2 automated setup
- **restart-server.sh** - Quick server restart
- **test-auth-flow.sh** - Test authentication API endpoints

### Database (2 scripts)
- **init-database.sh** - Initialize PostgreSQL with schema
- **run-migration.sh** - Run database migrations

### Docker (4 scripts)
- **start-services.sh** - Start all services
- **stop-services.sh** - Stop all services
- **clean-docker.sh** - Complete cleanup (⚠️ DESTRUCTIVE)
- **ensure-docker-services.sh** - Ensure services running for tests

### Testing (4 scripts)
- **test-e2e-setup.sh** - Complete E2E test suite
- **run-client-coverage.sh** - Client tests with coverage
- **run-server-coverage.sh** - Server tests with coverage
- **generate-test-report.js** - Generate comprehensive test report

### Utilities (4 scripts)
- **check-ports.sh** - Check all ports (3000, 3001, 5432)
- **check-port.sh** - Check single port (utility)
- **init-docker.sh** - Docker utilities (sourced by others)
- **generate-coverage-markdown.js** - Generate coverage reports

**Total: 17 scripts** (15 .sh + 2 .js)

---

## 🛠️ Development Scripts

### dev-terminals.sh ⭐
Opens iTerm2 with 4 color-coded panes for optimal development workflow.

**Usage**: `./scripts/dev-terminals.sh`

**Panes**:
- Top-left (Cyan): Database - PostgreSQL in Docker
- Top-right (Green): Server - Express API with hot reload
- Bottom-left (Blue): Client - React with hot reload
- Bottom-right (Purple): Claude Code - AI assistant

**Setup**: Create iTerm2 profiles named "Database", "Server", "Client", "Claude"

**Docs**: `docs/01_GETTING_STARTED.md`

---

### restart-server.sh
Quickly restart Express server during development.

**Usage**: `npm run server:restart`

---

### test-auth-flow.sh
Test authentication endpoints (registration, login, protected routes, admin).

**Usage**: `./scripts/test-auth-flow.sh`

**Prerequisites**: Services must be running

**Tests**: Registration → Login → Protected endpoint → Admin login → No auth

---

## 🗄️ Database Scripts

### init-database.sh ⭐
Complete database initialization with schema.

**Usage**: `npm run db:init`

**Steps**:
1. Check/start Docker
2. Start PostgreSQL container
3. Wait for ready
4. Create database
5. Run init.sql schema
6. Report status

---

### run-migration.sh
Run database migrations with tracking.

**Usage**:
- `npm run db:migrate` - All pending
- `npm run db:migrate:001` - Specific migration

**Migrations**: `server/database/migrations/`

---

## 🐳 Docker Scripts

### start-services.sh ⭐
Start all services with port checking.

**Usage**:
- `npm run start:services` - Foreground
- `npm run start:services:detached` - Background

**Services**: PostgreSQL (5432) + Express (3001) + React (3000)

---

### stop-services.sh
Gracefully stop all Docker services.

**Usage**: `npm run stop:services`

---

### clean-docker.sh ⚠️
**DESTRUCTIVE**: Complete Docker cleanup including data volumes.

**Usage**: `npm run clean:docker`

**⚠️ WARNING**: Deletes all database data!

---

### ensure-docker-services.sh
Ensure Docker services running (used by integration tests).

**Usage**: Auto-called by `npm run test:integration`

---

## 🧪 Testing Scripts

### test-e2e-setup.sh ⭐
Complete end-to-end test suite with coverage.

**Usage**: `npm run test:e2e`

**Does**: Port check → Clean → Init DB → Migrate → Test client → Test server → Coverage report

**Output**: `coverage-reports/`

---

### run-client-coverage.sh
Client tests with coverage (Jest + React Testing Library).

**Usage**: `./scripts/run-client-coverage.sh`

**Output**: `coverage/`

---

### run-server-coverage.sh
Server tests with coverage (Jest + Supertest).

**Usage**: `./scripts/run-server-coverage.sh`

**Output**: `server/coverage/`

---

### generate-test-report.js
Generate comprehensive markdown test report.

**Usage**: Called by `test-e2e-setup.sh`

**Output**: `COMPREHENSIVE_TEST_REPORT.md`

---

## 🔧 Utility Scripts

### check-ports.sh ⭐
Check if ports 3000, 3001, 5432 are available.

**Usage**: `npm run check-ports`

**Uses**: `check-port.sh` internally

---

### check-port.sh
Single port checker (utility called by other scripts).

**Usage**: `./scripts/check-port.sh <port> <service-name>`

---

### init-docker.sh
Docker utilities sourced by other scripts.

**Functions**: `check_docker()`, `start_docker()`, Docker version detection

**Used by**: `init-database.sh`

---

### generate-coverage-markdown.js
Generate markdown coverage reports from Jest JSON.

**Usage**: `node scripts/generate-coverage-markdown.js <client|server>`

**Output**: `coverage-reports/`

---

## 📚 Usage Examples

### Fresh Start
```bash
npm run clean:docker          # ⚠️ Deletes all data
npm run db:init               # Initialize DB
npm run db:migrate:001        # Run migrations
npm run start:services        # Start services
```

### Daily Development
```bash
# Option 1: 4-Terminal (Recommended)
./scripts/dev-terminals.sh

# Option 2: Docker Background
npm run start:services:detached

# Option 3: Manual Local
npm run db:init               # Terminal 1
cd server && npm run dev      # Terminal 2
npm start                     # Terminal 3
```

### Testing
```bash
npm run test:e2e              # Full suite with coverage
npm test                      # Client tests (watch)
cd server && npm test         # Server tests (watch)
./scripts/test-auth-flow.sh   # Auth endpoint tests
```

### Database
```bash
npm run db:init               # Initialize
npm run db:migrate            # Run migrations
npm run db:shell              # Open psql
npm run db:logs               # View logs
npm run db:status             # Check status
```

---

## 🔍 Script Dependencies

```
check-ports.sh
├── check-port.sh

init-database.sh
└── init-docker.sh

start-services.sh
└── check-ports.sh

test-e2e-setup.sh
├── check-ports.sh
├── clean-docker.sh
├── init-database.sh
├── run-migration.sh
├── run-client-coverage.sh
├── run-server-coverage.sh
├── generate-coverage-markdown.js
└── generate-test-report.js
```

---

## 📝 Conventions

**Exit Codes**: 0 (success), 1 (error), 2 (missing dependency), 3 (port conflict)

**Colors**: Red (errors), Green (success), Yellow (warnings), Blue (info)

**Safety**: Port checks, Docker verification, data warnings

---

## 📚 Related Documentation

- `docs/01_GETTING_STARTED.md` - Complete setup guide
- `docs/03_DOCKER.md` - Docker configuration
- `docs/04_DATABASE.md` - Database schema
- `docs/07_TESTING.md` - Testing guide

---

**Last Updated**: 2025-12-07
**Total Scripts**: 17 (15 .sh + 2 .js)
