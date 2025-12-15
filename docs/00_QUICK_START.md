# Spexture-com - Quick Start

## 🚀 Start Everything (One Command)

```bash
npm run test:e2e
```

**This single command does EVERYTHING:**

- ✅ Checks Docker is running
- ✅ Checks/clears port conflicts
- ✅ Cleans up old containers
- ✅ Starts database
- ✅ Runs migrations
- ✅ Starts backend server
- ✅ Starts frontend client
- ✅ Opens browser at http://localhost:3010
- ✅ Displays admin credentials
- ✅ Shows complete testing checklist

**Admin Credentials (shown in terminal output):**
```
Email:    admin@spexture-com.local
Password: Admin123!
```

## 🛑 Stop Everything

```bash
npm run stop:services
```

---

## Database Management

### Initialize/Reset Database
```bash
npm run db:init
```

### Database Commands
```bash
npm run db:status       # Check database status
npm run db:logs         # View database logs
npm run db:shell        # Open PostgreSQL shell
npm run db:restart      # Restart database
npm run db:admin        # View admin users
```

---

## Testing Commands

### Run Tests
```bash
# Client tests (watch mode)
npm test

# Client tests with coverage
npm run test:coverage

# Server tests
cd server && npm test

# All tests (client + server)
npm run test:all
```

---

## Development Workflow

### First-Time Setup
```bash
# 1. Make sure Docker Desktop is running
docker info

# 2. Initialize database
npm run db:init

# 3. Start all services
npm run start:services
```

### Daily Development
```bash
# Quick start (if services were stopped)
npm run start:services:detached

# Access application at http://localhost:3010
```

### Manual Testing Checklist
1. **Register** - Create new user account
2. **Login** - Test authentication
3. **Protected Routes** - Try /analyzer, /profile (should work when logged in)
4. **Admin Access** - Login as admin, access /admin routes
5. **Logout** - Verify logout functionality

---

## Troubleshooting

### Port Conflicts
```bash
# Check which ports are in use
npm run check-ports

# Kill processes on specific ports (if needed)
lsof -ti:3010 | xargs kill -9  # Client port (3000 reserved for react-super-app)
lsof -ti:3011 | xargs kill -9  # Server port (3001 reserved for react-super-app)
lsof -ti:5433 | xargs kill -9  # Database port (5432 reserved for react-super-app)
```

### Clean Start
```bash
# Stop everything
npm run stop:services

# Clean Docker resources (removes all data!)
npm run clean:docker

# Reinitialize
npm run db:init
npm run start:services
```

### View Logs
```bash
# Database logs
npm run db:logs

# Server status
npm run server:status

# Docker container status
docker compose ps
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run start:services` | Start all services (foreground) |
| `npm run start:services:detached` | Start all services (background) |
| `npm run stop:services` | Stop all services |
| `npm run db:init` | Initialize/reset database |
| `npm run check-ports` | Check port availability |
| `npm test` | Run client tests |
| `npm run test:coverage` | Run tests with coverage |

---

## Environment Variables

API keys are automatically loaded from `.env-00-script.zsh`:
- ✓ `OPENAI_API_KEY`
- ✓ `ANTHROPIC_API_KEY`
- ✓ `VAULT_ADDR`

---

## Tips & Tricks

**Keep this guide open while working:**
```bash
open QUICK_START.md --hide
```
This opens the file in your default markdown viewer without taking focus away from your terminal.

---

## Need More Help?

See detailed documentation:
- `README.md` - Project overview
- `CLAUDE.md` - Complete project context
- `docs/GETTING_STARTED.md` - Detailed setup
- `docs/TROUBLESHOOTING.md` - Common issues
