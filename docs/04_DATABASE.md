# 🗄️ Database Guide

Complete guide to the PostgreSQL database schema, setup, and management for the React Super App.

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Database Configuration](#-database-configuration)
3. [Database Schema](#-database-schema)
4. [RBAC (Role-Based Access Control)](#-rbac-role-based-access-control)
5. [Database Setup & Management](#-database-setup--management)
6. [Database Isolation](#-database-isolation)
7. [Accessing the Database](#-accessing-the-database)
8. [Security Best Practices](#-security-best-practices)

---

## 📊 Overview

The React Super App uses PostgreSQL as its primary database for tracking job searches, applications, and user data.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React)                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │  localStorage: JWT Token + User Data            │    │
│  └─────────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/REST API
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Server (Express/Node.js)                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  JWT Authentication + Request Validation        │    │
│  └─────────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────────────┘
                        │ PostgreSQL Connection Pool
                        ▼
┌─────────────────────────────────────────────────────────┐
│          PostgreSQL Database (Port 5432)                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │  8 Tables: users, auth logs, companies,        │    │
│  │  recruiters, resumes, cover letters, JDs, etc.  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Storage Components

1. **PostgreSQL Database** - Persistent server-side storage
2. **Docker Volume** - `postgres_data` for data persistence
3. **Connection Pool** - Efficient database connections
4. **REST API** - Interface between client and database
5. **Client localStorage** - Browser-based session storage

---

## ⚙️ Database Configuration

### Default Configuration

- **Image**: `postgres:15-alpine` (PostgreSQL 15 on Alpine Linux)
- **Port**: `5432` (configurable via `POSTGRES_PORT`)
- **Database Name**: `react_super_app` (configurable via `POSTGRES_DB`)
- **Username**: `superapp_user` (configurable via `POSTGRES_USER`)
- **Password**: `superapp_password` (configurable via `POSTGRES_PASSWORD`)
- **Data Persistence**: Docker volume `postgres_data`

### Environment Variables

Set these in `.env` file (project root):

```env
POSTGRES_USER=superapp_user
POSTGRES_PASSWORD=superapp_password
POSTGRES_DB=react_super_app
POSTGRES_PORT=5432
```

**⚠️ Security Note**: Change default passwords in production!

### Docker Compose Configuration

The PostgreSQL database is configured in `docker-compose.yml`:

```yaml
postgres:
  image: postgres:15-alpine
  container_name: react_super_app_postgres
  environment:
    POSTGRES_USER: ${POSTGRES_USER:-superapp_user}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-superapp_password}
    POSTGRES_DB: ${POSTGRES_DB:-react_super_app}
  ports:
    - "${POSTGRES_PORT:-5432}:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./server/database/init.sql:/docker-entrypoint-initdb.d/init.sql
  networks:
    - react_super_app_network
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-superapp_user}"]
    interval: 10s
    timeout: 5s
    retries: 5
  restart: unless-stopped
```

---

## 🗂️ Database Schema

### High-Level Schema Objects

#### **Phase 1: Foundation with RBAC (8 tables)** ✅

| # | Table | Purpose | Status |
|---|-------|---------|--------|
| 1 | **users** | Application users with RBAC | ✅ Complete |
| 2 | **user_auth_logs** | Audit trail for auth and admin actions | ✅ Complete |
| 3 | **companies** | Organizations offering jobs | ✅ Complete |
| 4 | **recruiters** | Recruiting contacts | ✅ Complete |
| 5 | **resumes** | Resume version tracking | ✅ Complete |
| 6 | **cover_letters** | Cover letter versions | ✅ Complete |
| 7 | **job_description_sources** | Where JDs came from | ✅ Complete |
| 8 | **job_descriptions** | Job postings (enhanced) | ✅ Complete |

#### **Phase 2: Submissions & Tracking (3 tables)** 🔄 *Planned*

| # | Table | Purpose | Status |
|---|-------|---------|--------|
| 9 | **submissions** | Application submissions | 🔄 Planned |
| 10 | **responses** | Company/recruiter responses | 🔄 Planned |
| 11 | **interviews** | Interview appointments | 🔄 Planned |

### Detailed Table Schemas

#### **1. users** 👤

**Purpose**: Application users with role-based access control

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_last_login_at ON users(last_login_at);
```

**Key Features**:
- Self-registration creates 'user' role by default
- First admin created via seed script (`admin@react-super-app.local` / `Admin123!`)
- Audit trail (created_by, updated_by)
- Soft delete via is_active flag
- Tracks last login for activity monitoring

#### **2. user_auth_logs** 📝

**Purpose**: Audit trail for all authentication events and admin actions

```sql
CREATE TABLE user_auth_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    performed_by UUID REFERENCES users(id),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_auth_logs_user_id ON user_auth_logs(user_id);
CREATE INDEX idx_user_auth_logs_action ON user_auth_logs(action);
CREATE INDEX idx_user_auth_logs_created_at ON user_auth_logs(created_at);
```

**Tracked Actions**:
- `login` - Successful login
- `logout` - User logout
- `failed_login` - Failed login attempt
- `password_change` - User changed own password
- `password_reset` - Admin reset user password
- `role_change` - Admin changed user role
- `account_deactivated` - Admin deactivated user
- `account_activated` - Admin activated user

**Key Features**:
- Immutable (no updates/deletes)
- Tracks who performed admin actions (performed_by)
- Stores additional context in JSONB metadata
- IP address and user agent for security monitoring

#### **3. companies** 🏢

**Purpose**: Organizations offering jobs (user-specific records)

```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    website VARCHAR(500),
    headquarters_location VARCHAR(255),
    description TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    notes TEXT,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    glassdoor_rating DECIMAL(2,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_name ON companies(name);
```

**Key Features**:
- User-specific (each user maintains their own company records)
- User can rate companies (1-5 stars)
- Optional Glassdoor rating for reference
- Notes for personal observations

#### **4. recruiters** 👔

**Purpose**: Recruiting contacts and hiring managers

```sql
CREATE TABLE recruiters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    recruiter_type VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    linkedin_url VARCHAR(500),
    notes TEXT,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recruiters_user_id ON recruiters(user_id);
CREATE INDEX idx_recruiters_company_id ON recruiters(company_id);
CREATE INDEX idx_recruiters_is_active ON recruiters(is_active);
```

**Recruiter Types**:
- `internal_hr` - Company HR department
- `external_agency` - Third-party recruiting agency
- `hiring_manager` - Direct hiring manager
- `independent` - Independent recruiter
- `headhunter` - Executive search

#### **5. resumes** 📄

**Purpose**: Track resume versions and which was used for each submission

```sql
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    file_path TEXT,
    file_type VARCHAR(50),
    file_size_bytes INTEGER,
    is_active BOOLEAN DEFAULT true,
    version_number INTEGER DEFAULT 1,
    content_summary TEXT,
    skills_highlighted TEXT[],
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_is_active ON resumes(is_active);
```

#### **6. cover_letters** 💌

**Purpose**: Cover letter version tracking

```sql
CREATE TABLE cover_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    file_name VARCHAR(255),
    file_path TEXT,
    file_type VARCHAR(50),
    is_template BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX idx_cover_letters_is_template ON cover_letters(is_template);
CREATE INDEX idx_cover_letters_is_active ON cover_letters(is_active);
```

#### **7. job_description_sources** 🔍

**Purpose**: Track where job descriptions originated

```sql
CREATE TABLE job_description_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    source_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jd_sources_source_type ON job_description_sources(source_type);
```

**Source Types**:
- `linkedin` - LinkedIn Jobs
- `indeed` - Indeed.com
- `glassdoor` - Glassdoor
- `company_website` - Direct from company site
- `recruiter` - From a recruiter
- `referral` - Employee referral
- `job_board` - Other job boards
- `email` - Email notification
- `other` - Other sources

#### **8. job_descriptions** 📋

**Purpose**: Enhanced job posting tracking

```sql
CREATE TABLE job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_id UUID REFERENCES job_description_sources(id),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    recruiter_id UUID REFERENCES recruiters(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    job_type VARCHAR(50),
    remote_policy VARCHAR(50),
    salary_range_min INTEGER,
    salary_range_max INTEGER,
    salary_currency VARCHAR(10),
    consulting_rate DECIMAL(10,2),
    consulting_period VARCHAR(50),
    contact_info TEXT,
    job_info TEXT,
    keywords TEXT[],
    status VARCHAR(50) DEFAULT 'saved',
    date_posted DATE,
    date_found DATE DEFAULT CURRENT_DATE,
    application_deadline DATE,
    is_duplicate BOOLEAN DEFAULT false,
    duplicate_of_id UUID REFERENCES job_descriptions(id),
    similarity_score DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_descriptions_user_id ON job_descriptions(user_id);
CREATE INDEX idx_job_descriptions_company_id ON job_descriptions(company_id);
CREATE INDEX idx_job_descriptions_status ON job_descriptions(status);
CREATE INDEX idx_job_descriptions_date_found ON job_descriptions(date_found);
```

**Job Status Values**:
- `saved` - Saved for later review
- `interested` - Interested in applying
- `applied` - Application submitted
- `interviewing` - In interview process
- `offered` - Job offer received
- `rejected` - Application rejected
- `withdrawn` - Application withdrawn
- `accepted` - Offer accepted

---

## 🔐 RBAC (Role-Based Access Control)

### User Roles

- **`admin`**: Full system access including user management
- **`user`**: Standard user access to own data only

### Admin Privileges

✅ List all users (with filters, sorting, pagination)
✅ Update user roles (user ↔ admin)
✅ Reset user passwords
✅ Activate/deactivate users
✅ View user activity logs
❌ Cannot delete users (soft delete only via is_active)

### User Privileges

✅ Full CRUD on own data (job descriptions, resumes, etc.)
✅ View own profile
✅ Update own profile (name, email, password)
❌ Cannot access other users' data
❌ Cannot access admin endpoints

### Elevated Session Authentication

Admin must re-authenticate with password before sensitive operations:
- Changing user roles
- Resetting user passwords
- Activating/deactivating users
- Viewing sensitive user data

**Security Features**:
- Elevated session expires after 15 minutes
- All admin actions logged in `user_auth_logs`
- Separate JWT token for elevated access

---

## 🚀 Database Setup & Management

### Initialize Database

The easiest way to set up and initialize the database:

```bash
# Initialize database (starts container, creates DB, runs schema)
npm run db:init
```

This script:
- ✅ Checks if Docker Desktop is running (auto-starts on macOS)
- ✅ Starts PostgreSQL container
- ✅ Waits for database to be ready
- ✅ Creates database if needed
- ✅ Creates UUID extension
- ✅ Initializes all tables, indexes, and triggers
- ✅ Verifies the setup

### Database Management Commands

```bash
# Initialize database (full setup)
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

# View admin users
npm run db:admin
```

### Manual Database Operations

```bash
# Start only PostgreSQL via Docker Compose
docker compose up -d postgres

# Check if database is ready
docker exec react_super_app_postgres pg_isready -U superapp_user

# Run migrations
npm run db:migrate:001
```

### Database Initialization Process

When the PostgreSQL container starts for the first time:
1. Creates the database `react_super_app`
2. Creates user `superapp_user` with password `superapp_password`
3. Executes `server/database/init.sql` to create tables, indexes, and triggers
4. Sets up UUID extension (`uuid-ossp`)
5. Creates default admin user

---

## 🔒 Database Isolation

### Overview

This application uses **its own uniquely named PostgreSQL database** and is completely isolated from other databases on the same PostgreSQL server.

### Isolation Configuration

- ✅ **Separate database** - `react_super_app` (not `postgres` default)
- ✅ **Dedicated user** - `superapp_user` (not `postgres` superuser)
- ✅ **Dedicated volume** - `react_super_app_postgres_data`
- ✅ **Dedicated network** - `react_super_app_network`
- ✅ **Dedicated container** - `react_super_app_postgres`

### How Isolation Works

#### 1. Database Level Isolation

PostgreSQL supports multiple databases on a single server:

```sql
-- This app's database
react_super_app

-- Other databases remain untouched
postgres          (PostgreSQL default)
template0         (PostgreSQL template)
template1         (PostgreSQL template)
your_other_db     (Your other applications)
```

#### 2. User Permissions

The `superapp_user` has permissions **ONLY** on `react_super_app`:

```sql
-- User can access ONLY react_super_app
GRANT ALL PRIVILEGES ON DATABASE react_super_app TO superapp_user;

-- User CANNOT access other databases
```

#### 3. Connection Isolation

Application connects **only** to `react_super_app`:

```javascript
// server/src/database/connection.js
const pool = new Pool({
  database: 'react_super_app',  // ← Isolated database
  user: 'superapp_user',         // ← Dedicated user
  // ...
});
```

### Verify Database Isolation

```bash
# Connect to PostgreSQL
npm run db:shell

# List all databases
\l

# You'll see:
# react_super_app  | superapp_user | UTF8  | ← This app
# postgres         | postgres      | UTF8  | ← Default (untouched)
# template0        | postgres      | UTF8  | ← Template (untouched)
# template1        | postgres      | UTF8  | ← Template (untouched)

# Check current database
SELECT current_database();
# Output: react_super_app

# List tables in THIS database only
\dt
```

### Multiple Applications on Same PostgreSQL

You can run **multiple applications** on the same PostgreSQL server:

```
PostgreSQL Server (localhost:5432)
├── react_super_app         ← This app
│   ├── users
│   ├── job_descriptions
│   └── ...
│
├── my_blog_app             ← Your blog
│   ├── posts
│   ├── comments
│   └── ...
│
└── my_ecommerce_app        ← Your store
    ├── products
    ├── orders
    └── ...
```

**Each app is completely isolated!**

---

## 🔌 Accessing the Database

### Command Line Access

```bash
# Connect to PostgreSQL shell
npm run db:shell

# OR directly via docker compose
docker compose exec postgres psql -U superapp_user -d react_super_app

# Run SQL commands directly
docker compose exec postgres psql -U superapp_user -d react_super_app -c "SELECT * FROM users;"

# List all tables
docker compose exec postgres psql -U superapp_user -d react_super_app -c "\dt"

# Describe table structure
docker compose exec postgres psql -U superapp_user -d react_super_app -c "\d users"
```

### Using Database Client

Connect using any PostgreSQL client:
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `react_super_app`
- **Username**: `superapp_user`
- **Password**: `superapp_password`

**Popular clients**:
- pgAdmin (GUI)
- DBeaver (GUI)
- psql (command line)
- TablePlus (GUI)
- DataGrip (GUI)

### Common SQL Queries

```sql
-- View all users
SELECT id, name, email, role, is_active, last_login_at FROM users;

-- View admin users only
SELECT * FROM users WHERE role = 'admin';

-- Check user authentication logs
SELECT * FROM user_auth_logs ORDER BY created_at DESC LIMIT 10;

-- View companies
SELECT * FROM companies;

-- View job descriptions with status
SELECT id, title, company_id, status, date_found FROM job_descriptions;

-- Count jobs by status
SELECT status, COUNT(*) FROM job_descriptions GROUP BY status;
```

---

## 🛡️ Security Best Practices

### ✅ What This App Does Right

1. **Dedicated Database** - Uses `react_super_app`, not `postgres` default
2. **Dedicated User** - Uses `superapp_user`, not `postgres` superuser
3. **Limited Permissions** - User can only access its own database
4. **Environment Variables** - Credentials configurable via `.env`
5. **Connection Pooling** - Efficient connection management
6. **No Shared Tables** - All tables isolated within `react_super_app`
7. **Audit Logging** - All admin actions logged
8. **Password Hashing** - bcrypt with 10 rounds
9. **Soft Deletes** - Uses `is_active` flag instead of hard deletes
10. **User Isolation** - Users can only access their own data

### ❌ What This App Avoids

1. ❌ Using `postgres` default database
2. ❌ Using `postgres` superuser
3. ❌ Hardcoded credentials
4. ❌ Global permissions
5. ❌ Shared schemas
6. ❌ Storing passwords in plain text
7. ❌ Hard deleting user data

### Production Security Checklist

- [ ] Change `POSTGRES_PASSWORD` to strong password
- [ ] Change JWT_SECRET to secure random string
- [ ] Enable SSL/TLS for database connections
- [ ] Restrict database access to application only
- [ ] Set up database backups
- [ ] Enable query logging for auditing
- [ ] Monitor authentication logs
- [ ] Use prepared statements (already implemented)
- [ ] Sanitize all user inputs (already implemented)
- [ ] Implement rate limiting on API

### Database Backup

```bash
# Backup database
docker compose exec postgres pg_dump -U superapp_user react_super_app > backup.sql

# Backup with timestamp
docker compose exec postgres pg_dump -U superapp_user react_super_app > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker compose exec -T postgres psql -U superapp_user react_super_app < backup.sql
```

---

## 🗑️ Database Cleanup

### Option 1: Remove Volume (Complete Cleanup)

```bash
docker compose down -v
npm run db:init
```

This removes the `postgres_data` volume and all data.

### Option 2: Drop Database (Keep Container)

```bash
# Connect to PostgreSQL
npm run db:shell

# Drop database
DROP DATABASE react_super_app;

# Recreate it
CREATE DATABASE react_super_app OWNER superapp_user;

# Run migrations
\q
npm run db:migrate:001
```

### Option 3: Use Clean Script

```bash
npm run clean:docker
npm run db:init
```

This removes all Docker resources for this app only.

---

## 📚 Additional Resources

### Internal Documentation
- **Quick Start**: See [`00_QUICK_START.md`](./00_QUICK_START.md)
- **Getting Started**: See [`01_GETTING_STARTED.md`](./01_GETTING_STARTED.md)
- **Docker**: See [`02_DOCKER.md`](./02_DOCKER.md)
- **Server API**: See [`04_SERVER.md`](./04_SERVER.md)
- **Commands**: See [`08_COMMANDS.md`](./08_COMMANDS.md)
- **Troubleshooting**: See [`09_TROUBLESHOOTING.md`](./09_TROUBLESHOOTING.md)

### External Resources
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Docker PostgreSQL](https://hub.docker.com/_/postgres)

---

**Your other databases are safe!** 🛡️

This application is completely isolated and will never touch:
- `postgres` default database
- Other application databases
- System tables or templates

---

**Database Name**: `react_super_app`
**Isolation Level**: Complete
**Status**: ✅ Production Ready
