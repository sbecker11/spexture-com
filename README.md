# 🚀 Spexture-com

A full-stack job search tracking application built with React 18, Express.js, and PostgreSQL. Track job applications, manage resumes, organize recruiters, and analyze job descriptions—all in one place.

## 📋 Project Overview

**Purpose**: Help job seekers manage their entire job search process from finding opportunities to tracking outcomes.

**Architecture**: Modern full-stack application with Docker containerization
- **Frontend**: React 18 with React Router, Yup validation, and context-based state management
- **Backend**: Express.js REST API with JWT authentication and RBAC
- **Database**: PostgreSQL 15 with 8 normalized tables
- **DevOps**: Docker Compose for local development with hot reload

**Key Features**:
- 🔐 User authentication with JWT and role-based access control (Admin/User)
- 🛡️ Protected routes with authentication checks
- 📊 Job description analyzer (in development)
- 👥 User management for admins
- 🧪 Comprehensive testing (96+ tests, 98.6% pass rate)
- 🐳 Fully containerized development environment

## 📊 Project Status

**Completion Rate**: **37%** (13/35 features complete)

**Current Phase**: Core authentication complete, building features

**Recent Milestones** (Dec 2025):
- ✅ Client-backend integration complete
- ✅ Authentication system production-ready
- ✅ Protected routes implemented
- ✅ RBAC system functional
- ✅ Documentation consolidated

**Next Priorities**:
1. Complete admin UI components
2. Implement JDAnalyzer functionality
3. Build job tracking features

📖 **See [docs/09_PROJECT_STATUS.md](./docs/09_PROJECT_STATUS.md) for detailed status and roadmap**

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed and running:

- **Docker Desktop** (version 20.10 or higher) - [Download here](https://www.docker.com/get-started)
  - **Must be running** before starting services
  - On macOS, our scripts can auto-start Docker Desktop for you
  - Verify Docker is running: `docker info`
  - Verify versions: `docker --version` and `docker-compose --version`
- **Git** - For cloning the repository
- **Ports Available**: Ensure ports 3000 (client), 3001 (server), and 5432 (database) are not in use

**Quick Port Check:**
```bash
# After cloning, run this to verify ports are available
npm run check-ports
```

### Quick Start

**Step 1: Clone the repository**
```bash
git clone https://github.com/sbecker11/spexture-com.git
cd spexture-com
```

**Step 2: Configure environment**
```bash
# Copy the environment template
cp .env.example .env

# (Optional) Edit .env to customize settings
# See Environment Variables section below for available options
```

**Step 3: Initialize the database**
```bash
# This script will:
# - Check/start Docker Desktop (auto-start on macOS)
# - Start PostgreSQL container
# - Create database and schema
npm run db:init
```

**Step 4: Start all services**
```bash
# Start client, server, and database
docker-compose up --build

# Or use our helper script with port checking:
npm run start:services

# Or run in background (detached mode):
npm run start:services:detached
```

**Step 5: Access the application**
- **Client**: [http://localhost:3010](http://localhost:3010)
- **API**: [http://localhost:3011](http://localhost:3011)
- **API Health**: [http://localhost:3011/api/health](http://localhost:3011/api/health)

**🎉 That's it!** The application is now running with all services.

### 4-Terminal Development Setup

For an optimized development workflow, use our iTerm2 script that opens 4 color-coded panes:

```bash
bash scripts/dev-terminals.sh
```

This creates:
- **Terminal 1 (Cyan)**: Database (PostgreSQL)
- **Terminal 2 (Green)**: Server (Express API with hot reload)
- **Terminal 3 (Blue)**: Client (React with hot reload)
- **Terminal 4 (Purple)**: Claude Code (AI assistant)

**Setup**: Create 4 profiles in iTerm2 named "Database", "Server", "Client", "Claude" with your preferred background colors.

📖 **For complete setup instructions, 4-terminal workflow details, and troubleshooting, see [docs/01_GETTING_STARTED.md](./docs/01_GETTING_STARTED.md)**

---

## 🔧 Environment Variables

The application uses environment variables for configuration. Copy `.env.example` to `.env` and customize as needed.

### Database Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SPEXTURE_POSTGRES_USER` | `spexture_user` | PostgreSQL username |
| `SPEXTURE_POSTGRES_PASSWORD` | `spexture_password` | PostgreSQL password |
| `SPEXTURE_POSTGRES_DB` | `spexture_com` | Database name |
| `SPEXTURE_POSTGRES_PORT` | `5433` | PostgreSQL port (5432 reserved for react-super-app) |

### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SPEXTURE_SERVER_PORT` | `3011` | Express server port (3001 reserved for react-super-app) |
| `SPEXTURE_NODE_ENV` | `development` | Node environment (`development`, `production`, `test`) |
| `SPEXTURE_JWT_SECRET` | `your-super-secret-jwt-key-change-in-production` | **⚠️ CHANGE IN PRODUCTION!** JWT signing key |
| `SPEXTURE_JWT_EXPIRES_IN` | `24h` | JWT token expiration time |

### Client Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SPEXTURE_CLIENT_PORT` | `3010` | React app port (3000 reserved for react-super-app) |
| `SPEXTURE_APP_API_URL` | `http://localhost:3011/api` | Backend API URL |
| `SPEXTURE_APP_ENV` | `development` | Client environment |
| `SPEXTURE_APP_ADMIN_EMAIL` | `admin@spexture-com.local` | Admin email (for dev auto-fill) |
| `SPEXTURE_APP_ADMIN_PASSWORD` | `Admin123!` | Admin password (for dev auto-fill) |

**Note**: All environment variables use the `SPEXTURE_` prefix to ensure complete isolation from other projects like `react-super-app`. This prevents conflicts when both projects are running simultaneously.

### Example `.env` File

```bash
# Database
SPEXTURE_POSTGRES_USER=spexture_user
SPEXTURE_POSTGRES_PASSWORD=spexture_password
SPEXTURE_POSTGRES_DB=spexture_com
SPEXTURE_POSTGRES_PORT=5433

# Server
SPEXTURE_SERVER_PORT=3011
SPEXTURE_NODE_ENV=development
SPEXTURE_JWT_SECRET=your-super-secret-jwt-key-change-in-production
SPEXTURE_JWT_EXPIRES_IN=24h

# Client
SPEXTURE_CLIENT_PORT=3010
SPEXTURE_APP_API_URL=http://localhost:3011/api
SPEXTURE_APP_ENV=development
SPEXTURE_APP_ADMIN_EMAIL=admin@spexture-com.local
SPEXTURE_APP_ADMIN_PASSWORD=Admin123!
```

**🔒 Security Note**: Never commit your `.env` file to version control. The `.env.example` file is provided as a template.

**💾 Data Persistence**: Database data persists in a Docker volume between restarts. To reset the database completely:
```bash
docker-compose down -v  # Removes volumes
npm run db:init         # Reinitialize database
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Header.js          # Top navigation header
│   ├── Footer.js          # Footer component
│   ├── Left.js            # Left sidebar navigation
│   ├── Home.js            # Home page component
│   ├── About.js           # About page component
│   ├── LoginRegister.js   # Login/Register form with validation
│   ├── JDAnalyzer.js      # Job Description Analyzer (in development)
│   ├── NotFound.js        # 404 error page
│   ├── ErrorBoundary.js   # Error boundary for React error handling
│   └── Loading.js         # Loading spinner component
├── services/              # API services (currently empty)
├── App.js                 # Main app component with routing
├── App.css                # Main app styles
├── index.js               # Application entry point
└── index.css              # Global styles
```

**💡 Tip:** To view the current project structure in your terminal, run:
```bash
tree -L 3 -I 'node_modules' --dirsfirst
```
This command displays the directory tree structure (up to 3 levels deep), excluding the `node_modules` folder, with directories shown first.

## 🛠️ Available Scripts

### Client Development Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Start** | `npm start` | Run React app in development mode at [http://localhost:3000](http://localhost:3000) |
| **Test** | `npm test` | Launch test runner in interactive watch mode |
| **Coverage** | `npm run test:coverage` | Run all tests and generate coverage report |
| **Build** | `npm run build` | Build optimized production bundle to `build/` folder |
| **Eject** | `npm run eject` | ⚠️ **One-way operation!** Eject from Create React App |

### Docker & Service Management

| Script | Command | Description |
|--------|---------|-------------|
| **Check Ports** | `npm run check-ports` | Verify ports 3000, 3001, 5432 are available |
| **Start Services** | `npm run start:services` | Start all Docker services with port checking |
| **Start Detached** | `npm run start:services:detached` | Start services in background (detached mode) |

### Database Management Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Initialize DB** | `npm run db:init` | 🚀 **Full database setup** - checks Docker, creates DB, runs schema |
| **Start DB** | `npm run db:start` | Start PostgreSQL container only |
| **Stop DB** | `npm run db:stop` | Stop PostgreSQL container |
| **Restart DB** | `npm run db:restart` | Restart PostgreSQL container |
| **DB Status** | `npm run db:status` | Check PostgreSQL container status |
| **DB Logs** | `npm run db:logs` | View PostgreSQL logs (follow mode) |
| **DB Shell** | `npm run db:shell` | Open PostgreSQL interactive shell |

### Common Workflows

**First-time setup:**
```bash
npm run db:init              # Initialize database
docker-compose up --build    # Start all services
```

**Daily development:**
```bash
npm run start:services:detached  # Start in background
npm start                        # Start client (if not using Docker)
```

**Troubleshooting:**
```bash
npm run check-ports          # Check for port conflicts
npm run db:logs              # View database logs
npm run db:status            # Check database status
docker-compose down -v       # Reset everything (removes data!)
npm run db:init              # Reinitialize
```

**Testing:**
```bash
npm test                     # Run tests in watch mode
npm run test:coverage        # Generate coverage report
```

## 🧪 Testing

**Quick Commands:**
```bash
npm test                    # Run tests in watch mode
npm run test:coverage       # Generate coverage report
cd server && npm test       # Run server tests
```

**Test Status**: 96+ tests, 98.6% pass rate (575/583 passing)
- Client: 69 tests, 52% coverage
- Server: 27 tests, 47% coverage

📖 **For comprehensive testing guide, see [docs/07_TESTING.md](./docs/07_TESTING.md)**

## 🔍 Application Routes

### Public Routes
- `/` or `/home` - Home page
- `/about` - About page
- `/login-register` - Login/Register form

### Protected Routes (Require Authentication)
- `/analyzer` - Job Description Analyzer
- `/profile` - User profile management
- `/admin` - Admin dashboard (admin role required)
- `/admin/users` - User management (admin role required)
- `/admin/testing` - Testing coverage viewer (admin role required)

### Error Routes
- `*` (any other path) - 404 Not Found page

📖 **For complete routing documentation, see [docs/06_CLIENT.md](./docs/06_CLIENT.md)**

## 📝 Key Features

### ✅ Completed
- 🔐 **Authentication**: JWT-based with bcrypt password hashing
- 🛡️ **RBAC**: Role-Based Access Control (Admin/User)
- 🔒 **Protected Routes**: Authentication-required routes
- ✅ **Form Validation**: Yup-based with real-time feedback
- 🚨 **Error Handling**: Error boundaries for graceful recovery
- ⏳ **Loading States**: Reusable loading spinner
- 🔔 **Toast Notifications**: Success/error feedback
- 🐳 **Docker Support**: Full containerization
- 🧪 **Testing**: 96+ tests with high pass rate

### 🔄 In Progress
- 👥 Admin UI components (20% complete)
- 📊 JDAnalyzer functionality (10% complete)

### 📋 Planned
- Job search tracking
- Resume/cover letter management
- Interview tracking
- Analytics and reporting
- Email integration

📖 **For complete feature roadmap, see [docs/02_FEATURES.md](./docs/02_FEATURES.md)**

## 🔧 Troubleshooting

### Issue: `npm start` fails with errors
**Solution**: Make sure you've run `npm install` first to install all dependencies.

### Issue: Port 3000 is already in use
**Solution**: You can specify a different port:
```bash
PORT=3001 npm start
```

### Issue: Dependencies out of sync
**Solution**: Delete `node_modules` and `package-lock.json`, then reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentation

This project includes comprehensive documentation covering all aspects of development, deployment, testing, and more. All documentation files are located in the [`docs/`](./docs/) directory.

### 📑 Core Documentation (Numbered Sequence)

Follow these docs in order for the complete picture:

1. **[00_QUICK_START.md](./docs/00_QUICK_START.md)** - One-command startup guide
2. **[01_GETTING_STARTED.md](./docs/01_GETTING_STARTED.md)** - Complete setup with 4-terminal development workflow
3. **[02_FEATURES.md](./docs/02_FEATURES.md)** - Architecture diagrams + feature roadmap (37% complete)
4. **[03_DOCKER.md](./docs/03_DOCKER.md)** - Docker Compose setup and configuration
5. **[04_DATABASE.md](./docs/04_DATABASE.md)** - PostgreSQL schema (8 tables) with RBAC + database credentials
6. **[05_SERVER.md](./docs/05_SERVER.md)** - Express.js REST API reference
7. **[06_CLIENT.md](./docs/06_CLIENT.md)** - React app guide with components and routing
8. **[07_TESTING.md](./docs/07_TESTING.md)** - Testing guide (96+ tests, coverage analysis)
9. **[08_TROUBLESHOOTING.md](./docs/08_TROUBLESHOOTING.md)** - Common issues and solutions
10. **[09_PROJECT_STATUS.md](./docs/09_PROJECT_STATUS.md)** - Current status, accomplishments, roadmap + admin credentials

### 🎨 Additional Resources

- **[CLAUDE.md](./CLAUDE.md)** - Project context for AI assistants
- **[VALIDATION_GUIDE.md](./docs/VALIDATION_GUIDE.md)** - Form validation patterns with Yup

---

## 📚 Learn More

- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React Documentation](https://reactjs.org/)
- [React Router Documentation](https://reactrouter.com/)
- [Yup Validation Documentation](https://github.com/jquense/yup)
- [Vite Documentation](https://vitejs.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

## 📄 License

This project is private.

---

**Note**: Fixed `react-scripts` version issue (was set to 0.0.0, now set to 5.0.1) and removed duplicate/invalid package entry.
