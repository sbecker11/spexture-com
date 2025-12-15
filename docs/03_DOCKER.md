# 🐳 Docker Setup & Configuration Guide

Complete guide for setting up and running the Spexture-com using Docker Compose with PostgreSQL and REST API.

---

## 📋 Table of Contents

1. [Architecture](#-architecture)
2. [Prerequisites](#-prerequisites)
3. [Quick Start](#-quick-start)
4. [Docker Compose Services](#-docker-compose-services)
5. [Available Commands](#-available-commands)
6. [Database Schema](#-database-schema)
7. [REST API Endpoints](#-rest-api-endpoints)
8. [Development Workflow](#-development-workflow)
9. [File Sharing Configuration](#-file-sharing-configuration)
10. [Troubleshooting](#-troubleshooting)
11. [Production Deployment](#-production-deployment)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Client     │  │   Server     │  │  PostgreSQL  │  │
│  │  (React)     │  │  (Express)   │  │  (Database)  │  │
│  │  Port 3000   │  │  Port 3001   │  │  Port 5432   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Project Structure

```
spexture-com/
├── docker-compose.yml          # Docker orchestration
├── Dockerfile.client           # React client Dockerfile
├── .dockerignore              # Docker ignore rules
├── server/                    # Backend server
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── index.js
│   │   ├── database/
│   │   │   └── connection.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── routes/
│   │       ├── auth.js
│   │       └── users.js
│   └── database/
│       └── init.sql
└── src/                       # React client
    └── ...
```

---

## 📋 Prerequisites

1. **Docker** (version 20.10 or higher)
   - Install from: https://www.docker.com/get-started
   - Verify installation: `docker --version`

2. **Docker Compose** (usually comes with Docker Desktop)
   - Verify installation: `docker compose --version`
   - **Note**: Use `docker compose` (V2) instead of `docker-compose` (V1)

3. **Docker Desktop File Sharing** (macOS/Windows)
   - Must have access to the project directory
   - See [File Sharing Configuration](#-file-sharing-configuration) section below

---

## 🚀 Quick Start

### 1. Clone/Prepare Repository

Make sure you're in the project root directory:
```bash
cd /Users/sbecker11/workspace-react/spexture-com
```

### 2. Create Environment File

Copy the example environment template:
```bash
cp .env.example .env
```

### 3. Configure Environment Variables

**Important:** Update the following in your `.env` file based on your environment:

- **`NODE_ENV`**: Set to `development` (default), `testing` (for running tests), or `production` (for deployment)
- **`REACT_APP_ENV`**: Set to match `NODE_ENV` for consistency

The `.env.example` file includes all default values:
- Database configuration (PostgreSQL)
- Server and client port configuration
- API URL configuration
- JWT secret (⚠️ change this in production!)

**Default values are fine for development**, but you should:
- Update `NODE_ENV` and `REACT_APP_ENV` to `testing` when running tests
- Update `NODE_ENV` and `REACT_APP_ENV` to `production` for deployment
- Change `JWT_SECRET` to a secure random string in production (use: `openssl rand -base64 32`)

### 4. Start All Services

```bash
docker compose up --build
```

This will:
- Build Docker images for client, server, and database
- Start PostgreSQL database
- Initialize database schema
- Start Express REST API server
- Start React development server

### 5. Access the Application

- **React Client**: http://localhost:3000
- **REST API Server**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health
- **PostgreSQL**: localhost:5433 (for direct database access, 5432 reserved for react-super-app)

---

## 📦 Docker Compose Services

### PostgreSQL Database
- **Image**: postgres:15-alpine
- **Port**: 5433 (host port, 5432 reserved for react-super-app)
- **Database**: spexture_com
- **User**: spexture_user
- **Password**: superapp_password (change in production)
- **Volume**: Persistent data storage (`postgres_data`)
- **Features**:
  - Automatic schema initialization from `server/database/init.sql`
  - Data persists between container restarts
  - Health checks enabled

### Express REST API Server
- **Port**: 3001
- **Base URL**: http://localhost:3001
- **API Base**: http://localhost:3001/api
- **Features**:
  - JWT authentication with bcrypt password hashing
  - User registration/login endpoints
  - User CRUD operations with ownership checks
  - PostgreSQL connection pool
  - CORS enabled for cross-origin requests
  - Security headers (Helmet middleware)
  - Health check endpoint
  - Hot reload with nodemon (development)

### React Client
- **Port**: 3000
- **URL**: http://localhost:3000
- **Features**:
  - Hot reload in development (webpack dev server)
  - Environment variable support (REACT_APP_*)
  - API URL configuration
  - Optimized production builds
  - Error boundaries and loading states

---

## 📝 Available Commands

### Start Services

```bash
# Start all services (detached mode)
docker compose up -d

# Start with build (recommended for first time or after changes)
docker compose up --build

# Start in foreground (see logs in terminal)
docker compose up

# Start specific service
docker compose up server
docker compose up client
docker compose up postgres
```

### Stop Services

```bash
# Stop all services (keeps containers and volumes)
docker compose down

# Stop and remove volumes (⚠️ deletes database data)
docker compose down -v
```

### View Logs

```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs server
docker compose logs client
docker compose logs postgres

# Follow logs (like tail -f)
docker compose logs -f server

# Show last N lines
docker compose logs --tail=100 server
```

### Database Access

```bash
# Connect to PostgreSQL container
docker compose exec postgres psql -U spexture_user -d spexture_com

# Run SQL commands
docker compose exec postgres psql -U spexture_user -d spexture_com -c "SELECT * FROM users;"

# Backup database
docker compose exec postgres pg_dump -U spexture_user spexture_com > backup.sql

# Restore database
docker compose exec -T postgres psql -U spexture_user spexture_com < backup.sql
```

### Database Management Commands (npm scripts)

```bash
# Initialize database (starts container + creates schema)
npm run db:init

# Start database container
npm run db:start

# Stop database container
npm run db:stop

# Restart database
npm run db:restart

# Check database status
npm run db:status

# View database logs
npm run db:logs

# Connect to PostgreSQL shell
npm run db:shell
```

**Note:** The `db:init` script automatically checks if Docker Desktop is running and starts it if needed (macOS).

### Rebuild Services

```bash
# Rebuild all services
docker compose build

# Rebuild with no cache (clean build)
docker compose build --no-cache

# Rebuild specific service
docker compose build server
docker compose build client
```

### Service Management

```bash
# Check service status
docker compose ps

# Restart specific service
docker compose restart server
docker compose restart client
docker compose restart postgres

# Stop specific service
docker compose stop server

# Start stopped service
docker compose start server
```

### Test Commands Summary

| Command | Description |
|---------|-------------|
| `npm test` | Run client tests (watch mode) |
| `npm test -- --watchAll=false` | Run client tests once |
| `npm run test:coverage` | Client tests with coverage |
| `cd server && npm test` | Run server tests |
| `cd server && npm test -- --coverage` | Server tests with coverage |
| `cd server && npm test -- middleware/auth.test.js` | Run specific test file |

**Note:** Server API integration tests require PostgreSQL to be running. Start it with `npm run db:init` before running server tests.

---

## 🗄️ Database Schema

The database is automatically initialized with the following schema:

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Job Descriptions Table
```sql
CREATE TABLE job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    source_id UUID REFERENCES job_description_sources(id),
    company_id UUID REFERENCES companies(id),
    recruiter_id UUID REFERENCES recruiters(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    job_type VARCHAR(50),
    remote_policy VARCHAR(50),
    salary_range_min INTEGER,
    salary_range_max INTEGER,
    salary_currency VARCHAR(10),
    keywords TEXT[],
    status VARCHAR(50) DEFAULT 'saved',
    date_posted DATE,
    date_found DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_descriptions_user_id ON job_descriptions(user_id);
CREATE INDEX idx_job_descriptions_status ON job_descriptions(status);
```

**Note:** Complete schema includes 8 tables total. See `server/database/init.sql` for full schema.

---

## 🔌 REST API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication

#### POST `/api/auth/register`
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### POST `/api/auth/login`
Login user
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Users (Requires Authentication)

**Headers Required:**
```
Authorization: Bearer <JWT_TOKEN>
```

#### GET `/api/users`
Get all users (admin only)

#### GET `/api/users/me`
Get current authenticated user

#### GET `/api/users/:id`
Get user by ID (ownership check or admin)

#### PUT `/api/users/:id`
Update user (ownership check or admin)
```json
{
  "name": "John Updated",
  "email": "newemail@example.com"
}
```

#### DELETE `/api/users/:id`
Delete user (ownership check or admin)

### Authentication Flow

1. User registers/logs in via `/api/auth/register` or `/api/auth/login`
2. Server validates credentials and returns JWT token
3. Client stores token in localStorage
4. Client includes token in `Authorization: Bearer <token>` header
5. Server validates token on protected routes

---

## 🔧 Development Workflow

### Making Changes

1. **Client Changes**: Files are mounted as volumes, so changes auto-reload
2. **Server Changes**: Files are mounted as volumes, nodemon auto-restarts
3. **Database Changes**: Restart postgres service or run migrations

### Running Migrations

```bash
# Connect to server container and run migrations
docker compose exec server npm run migrate
```

### Testing the API

```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get current user (requires token from login)
curl http://localhost:3001/api/users/me \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 🔐 File Sharing Configuration

Docker Desktop needs access to the project directory to mount files into containers.

### Folder to Share
```
/Users/sbecker11/workspace-react/spexture-com
```

### macOS Instructions

1. **Open Docker Desktop**
   - Click the Docker icon in the menu bar
   - Or open Docker Desktop from Applications

2. **Open Settings**
   - Click on the gear icon (⚙️) in the top right
   - Or go to Docker Desktop → Settings

3. **Go to Resources → File Sharing**
   - Click "Resources" in the left sidebar
   - Click "File Sharing" in the Resources section

4. **Add the Project Directory**
   - Click the "+" button or "Add folder" button
   - Navigate to: `/Users/sbecker11/workspace-react/spexture-com`
   - Click "Apply & Restart"

5. **Wait for Docker to Restart**
   - Docker Desktop will restart to apply the changes
   - Wait for Docker to fully start (whale icon in menu bar should be steady)

### Alternative: Share Parent Directory

If the exact folder doesn't work, you can share the parent directory:
```
/Users/sbecker11/workspace-react
```

This will give Docker access to all projects in that directory.

### Verify Configuration

After configuring, verify with:
```bash
docker run --rm -v /Users/sbecker11/workspace-react/spexture-com:/test alpine ls /test
```

This should list the files in your project directory without errors.

### Quick Check Script

Run this to check if the folder is already shared:
```bash
docker run --rm -v /Users/sbecker11/workspace-react/spexture-com:/test alpine ls /test/server/database/init.sql 2>&1
```

If it shows the file, file sharing is configured correctly!

---

## 🐛 Troubleshooting

### Port Already in Use

If port 3000, 3001, or 5432 is already in use:

1. **Change ports in `.env` file:**
```bash
CLIENT_PORT=3002
SERVER_PORT=3003
POSTGRES_PORT=5433
```

2. **Or stop conflicting services:**
```bash
# Find process using port
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Kill process
kill -9 <PID>
```

### Database Connection Errors

```bash
# Check if postgres is running
docker compose ps postgres

# Check postgres logs
docker compose logs postgres

# Restart postgres
docker compose restart postgres

# Test connection
docker compose exec postgres pg_isready -U spexture_user
```

### Container Won't Start

```bash
# Check logs
docker compose logs <service-name>

# Rebuild containers
docker compose down
docker compose build --no-cache
docker compose up
```

### Database Data Persistence

Data is stored in a Docker volume `postgres_data`. To reset:

```bash
# ⚠️ WARNING: This deletes all data!
docker compose down -v
docker compose up
```

### "Cannot find module" Errors

**For server:**
```bash
cd server
npm install
docker compose restart server
```

**For client:**
```bash
npm install
docker compose restart client
```

### File Sharing Errors

**Error**: `Error response from daemon: Mounts denied`

**Solution**: Configure Docker Desktop file sharing as described in [File Sharing Configuration](#-file-sharing-configuration) section.

### Image Build Failures

```bash
# Clear Docker cache and rebuild
docker compose down
docker system prune -a
docker compose build --no-cache
docker compose up
```

---

## 📦 Production Deployment

For production:

### 1. Update `.env` file:
   - Change `JWT_SECRET` to a strong random string:
     ```bash
     openssl rand -base64 32
     ```
   - Update `NODE_ENV=production`
   - Update `REACT_APP_ENV=production`
   - Use secure passwords for database
   - Update `CLIENT_URL` to production domain

### 2. Build production images:
   ```bash
   docker compose -f docker-compose.prod.yml build
   ```

### 3. Use production docker-compose file
   - Create `docker-compose.prod.yml` with optimized settings
   - Use multi-stage builds for smaller images
   - Disable development features (hot reload, source maps)
   - Enable production optimizations

### 4. Set up reverse proxy
   - Use nginx or traefik for SSL/HTTPS
   - Configure load balancing if needed
   - Set up SSL certificates (Let's Encrypt)

### 5. Backup database regularly:
   ```bash
   docker compose exec postgres pg_dump -U spexture_user spexture_com > backup.sql
   ```

### 6. Security Checklist:
   - [ ] Change all default passwords
   - [ ] Use strong JWT_SECRET
   - [ ] Enable HTTPS/SSL
   - [ ] Implement rate limiting
   - [ ] Add input sanitization
   - [ ] Restrict database access
   - [ ] Enable security headers
   - [ ] Set up monitoring and logging
   - [ ] Use environment variables for all secrets
   - [ ] Disable debug mode

---

## 📚 Additional Resources

### Internal Documentation
- **Quick Start**: See [`00_QUICK_START.md`](./00_QUICK_START.md) for single command setup
- **Getting Started**: See [`01_GETTING_STARTED.md`](./01_GETTING_STARTED.md) for complete setup guide
- **Database**: See [`03_DATABASE.md`](./03_DATABASE.md) for database details
- **Testing**: See [`04_TESTING.md`](./04_TESTING.md) for comprehensive testing information
- **Commands**: See [`06_COMMANDS.md`](./06_COMMANDS.md) for a quick command reference
- **Troubleshooting**: See [`07_TROUBLESHOOTING.md`](./07_TROUBLESHOOTING.md) for common issues and solutions
- **Storage & Database**: See [`STORAGE_GUIDE.md`](./STORAGE_GUIDE.md) for database schemas and API details

### External Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Documentation](https://expressjs.com/)

---

## 🎯 Next Steps

1. Integrate React client with REST API
2. Add authentication context to React app
3. Implement protected routes
4. Add job description CRUD operations
5. Add database migrations system
6. Add API request/response logging
7. Add rate limiting
8. Add API documentation (Swagger/OpenAPI)

---

**Happy Dockerizing! 🐳**
