# CLAUDE.md - Spexture-com Project Context

> **Last Updated**: 2025-12-06
> **Project Status**: ~31% Complete (Backend ready, Client integration in progress)
> **Priority**: High - Client-Backend Integration

---

## 📋 Project Overview

**Spexture-com** is a full-stack job search tracking application built to help users manage their job search process, from saving job descriptions to tracking applications, interviews, and responses.

### Core Purpose
- **Job Description Management**: Save, analyze, and track job descriptions from multiple sources
- **Application Tracking**: Monitor the full application pipeline from initial interest to final outcome
- **Resume & Cover Letter Versioning**: Track which documents were used for each application
- **Recruiter & Company Management**: Maintain a personal network of companies and recruiters
- **Role-Based Access Control**: Admin users can manage other users and view system-wide activity

---

## 🏗️ Architecture

### Tech Stack
```
Frontend:  React 18 + React Router + Yup Validation + CSS
Backend:   Express.js + JWT Authentication + bcrypt
Database:  PostgreSQL 14+ with RBAC
DevOps:    Docker Compose + npm scripts
Testing:   Jest + React Testing Library + Supertest
```

### Project Structure
```
spexture-com/
├── src/                          # React client application
│   ├── components/               # UI components
│   │   ├── Header.js            # Navigation header (uses AuthContext, ThemeContext)
│   │   ├── LoginRegister.js     # Auth forms with Yup validation
│   │   ├── AdminDashboard.js    # Admin user management (20% coverage)
│   │   ├── UserManagement.js    # User listing (1.01% coverage - NEEDS TESTS)
│   │   └── ...
│   ├── contexts/
│   │   ├── AuthContext.js       # User authentication state + RBAC helpers
│   │   └── ThemeContext.js      # Light/dark theme management
│   ├── services/
│   │   ├── api.js               # HTTP client with token management
│   │   └── adminAPI.js          # Admin-specific API methods (9.76% coverage)
│   └── validation/              # Centralized form validation rules
│
├── server/                       # Express.js REST API
│   ├── src/
│   │   ├── index.js             # Main server entry point
│   │   ├── database/
│   │   │   └── connection.js    # PostgreSQL connection pool
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT authentication
│   │   │   └── rbac.js          # Role-based access control
│   │   └── routes/
│   │       ├── auth.js          # Registration, login, token management
│   │       ├── users.js         # User CRUD with ownership checks
│   │       └── admin.js         # Admin-only user management endpoints
│   └── database/
│       ├── init.sql             # Initial schema
│       └── migrations/          # Schema migrations
│
├── docs/                         # Comprehensive documentation
├── scripts/                      # Automation scripts
├── coverage-reports/             # Test coverage reports
└── docker-compose.yml           # Full-stack container orchestration
```

---

## 🎯 Current Status & Priority Actions

**Last Updated:** 2025-12-06

### ✅ Completed (37% Overall - Updated Dec 6, 2025)
1. **Backend Infrastructure**: Express API with PostgreSQL fully functional
2. **Authentication System**: JWT-based auth with bcrypt password hashing
3. **RBAC Implementation**: Admin/user roles with elevated session tokens
4. **Database Schema**: 8 tables including users, companies, recruiters, resumes, cover letters, job descriptions, sources, auth logs
5. **Client Components**: React app with routing, forms, validation (Yup)
6. **Testing Framework**: 96+ tests, 98% statement coverage (server)
7. **Docker Setup**: Complete containerized development environment
8. ✅ **Client-Backend Integration**: LoginRegister fully connected to API (lines 236-261)
9. ✅ **Authentication Context**: Complete with token management, role checking, elevated sessions
10. ✅ **Protected Routes**: Implemented and applied to 5 routes (/analyzer, /profile, /admin, /admin/users, /admin/testing)

**See:** `HIGH_PRIORITY_ITEMS_STATUS.md` for detailed review of recently completed authentication features.

### 🔴 High Priority (Current Work)
1. **Verify Test Status** (Test report from Dec 3 shows 116 failures)
   - Test files reviewed appear properly configured
   - `Header.test.js` uses `TestRouterWithAllProviders`
   - `LoginRegister.test.js` has comprehensive mocking
   - Need to run tests to verify current status

2. **Manual Authentication Flow Testing**
   - Test registration flow end-to-end
   - Test login flow with valid/invalid credentials
   - Verify protected routes redirect properly
   - Test admin role enforcement on admin routes
   - Verify token persistence across page reloads

### 🟡 Medium Priority (Next Phase)
- Toast/Notification System for user feedback
- Complete JDAnalyzer core functionality (word frequency, keyword extraction)
- Increase test coverage for admin components (UserManagement: 1.01%, AdminAuthModal: 3.7%)
- Add integration tests for admin functionality
- Improve branch coverage (currently only 2.12%)

---

## 🗄️ Database Schema (PostgreSQL)

### Core Tables

#### 1. **users** - Application users with RBAC
```sql
id, name, email, password_hash, role ('admin'|'user'),
is_active, last_login_at, created_by, updated_by, created_at, updated_at
```
- **Default Admin**: `admin@spexture-com.local` / `Admin123!`
- **Self-registration**: Creates 'user' role by default

#### 2. **user_auth_logs** - Security audit trail
```sql
id, user_id, action (login|logout|failed_login|password_reset|role_change),
ip_address, user_agent, success, failure_reason, performed_by, metadata (JSONB), created_at
```

#### 3. **companies** - User-specific company records
```sql
id, user_id, name, industry, company_size, website, headquarters_location,
description, phone, email, notes, user_rating (1-5), glassdoor_rating, created_at, updated_at
```

#### 4. **recruiters** - Recruiting contacts
```sql
id, user_id, name, title, company_id, recruiter_type
(internal_hr|external_agency|hiring_manager|independent|headhunter),
email, phone, linkedin_url, notes, user_rating (1-5), is_active, created_at, updated_at
```

#### 5. **resumes** - Resume version tracking
```sql
id, user_id, title, file_name, file_path, file_type, file_size_bytes,
is_active, version_number, content_summary, skills_highlighted (TEXT[]), notes, created_at, updated_at
```

#### 6. **cover_letters** - Cover letter versions
```sql
id, user_id, title, content, file_name, file_path, file_type,
is_template, is_active, notes, created_at, updated_at
```

#### 7. **job_description_sources** - Where JDs came from
```sql
id, source_type (linkedin|indeed|glassdoor|company_website|recruiter|referral|job_board|email|other),
source_name, source_url, created_at
```

#### 8. **job_descriptions** - Enhanced job postings
```sql
id, user_id, source_id, company_id, recruiter_id, title, description, location,
job_type (full_time|part_time|contract|freelance), remote_policy (remote|hybrid|onsite),
salary_range_min, salary_range_max, salary_currency, consulting_rate, consulting_period,
contact_info, job_info, keywords (TEXT[]),
status (saved|interested|applied|interviewing|offered|rejected|withdrawn|accepted),
date_posted, date_found, application_deadline,
is_duplicate, duplicate_of_id, similarity_score, notes, created_at, updated_at
```

### Access Control
- **Users**: Can only access their own data (enforced by `user_id` checks)
- **Admins**: Can manage users but NOT access other users' job search data
- **Elevated Sessions**: Required for sensitive admin operations (15-minute expiry)

---

## 🔌 API Endpoints

### Base URLs
- **Client**: http://localhost:3000
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

### Authentication Endpoints (`/api/auth/`)
```
POST   /register           - Register new user (creates 'user' role)
POST   /login              - Login (returns JWT token with role, updates last_login_at)
```

### User Endpoints (`/api/users/`) - Requires Authentication
```
GET    /                   - Get all users (admin) or error
GET    /me                 - Get current user profile
GET    /:id                - Get user by ID (ownership check)
PUT    /:id                - Update user (ownership check)
DELETE /:id                - Delete user (ownership check)
```

### Admin Endpoints (`/api/admin/`) - Requires Admin Role
```
POST   /verify-password                 - Get elevated session token (15-min expiry)
GET    /users                           - List all users (filters: role, status, search; sort; paginate)
GET    /users/:id                       - Get detailed user info
PUT    /users/:id/role                  - Change user role (requires elevated session)
PUT    /users/:id/password              - Reset user password (requires elevated session)
PUT    /users/:id/status                - Activate/deactivate user (requires elevated session)
GET    /users/:id/activity              - Get user activity logs
```

---

## 🧪 Testing

### Current Status
- **Total Tests**: 96+ tests
- **Pass Rate**: 72.77% (116 client tests failing due to missing context providers)
- **Coverage**:
  - Server: 47.33% statement coverage
  - Client: 52.41% statement coverage
  - Combined: 49.87% (Target: 70%)
  - Branch: 2.12% (Very low - needs conditional path testing)

### Critical Test Gaps
1. **Client Tests Failing** (116 failures)
   - `Header.test.js` - Missing AuthProvider wrapper
   - `LoginRegister.test.js` - Incorrect button text assertions ("Save" instead of "Register"/"Login")

2. **Low Coverage Files**:
   - `server/src/routes/admin.js` - 8.59%
   - `server/src/middleware/rbac.js` - 40.82%
   - `src/components/UserManagement.js` - 1.01%
   - `src/components/UserEditModal.js` - 1.14%
   - `src/services/adminAPI.js` - 9.76%
   - `src/validation/fieldValidation.js` - 0%

### Test Commands
```bash
# Client tests
npm test                          # Interactive watch mode
npm run test:coverage             # Generate coverage report

# Server tests
cd server && npm test             # All server tests
cd server && npm test -- --testPathPattern="middleware"  # Specific tests

# All tests (from root)
npm run test:all                  # Run client + server tests
```

### Testing Best Practices for This Project
- **ALWAYS wrap tests with providers**:
  ```javascript
  import { renderWithProviders } from '../test-utils';

  test('renders header', () => {
    renderWithProviders(<Header />);
  });
  ```
- **Mock AuthContext for component tests**:
  ```javascript
  const mockAuthContext = {
    user: { id: '123', name: 'Test User', role: 'user' },
    isAuthenticated: true,
    isAdmin: () => false
  };
  ```
- **Test both authenticated and unauthenticated states**
- **Test admin vs. user role differences**

---

## 🚀 Development Workflow

### First-Time Setup
```bash
# 1. Clone repo
git clone https://github.com/sbecker11/spexture-com.git
cd spexture-com

# 2. Configure environment
cp .env.example .env
# Edit .env if needed (change JWT_SECRET for production!)

# 3. Initialize database (auto-starts Docker on macOS)
npm run db:init

# 4. Start all services
docker-compose up --build
# OR: npm run start:services
# OR: npm run start:services:detached (background)

# 5. Access application
# Client: http://localhost:3000
# API: http://localhost:3001
```

### Daily Development
```bash
# Option 1: All services in Docker
npm run start:services:detached

# Option 2: Local development (faster hot reload)
npm run db:init                  # Database in Docker
cd server && npm run dev         # Terminal 1: Server locally
npm start                        # Terminal 2: Client locally
```

### Useful Commands
```bash
# Check ports availability
npm run check-ports

# Database management
npm run db:status                # Check status
npm run db:logs                  # View logs
npm run db:shell                 # Open psql shell
npm run db:restart               # Restart container
npm run db:migrate               # Run migrations

# Docker commands
docker-compose ps                # Check container status
docker-compose logs -f server    # Follow server logs
docker-compose restart client    # Restart specific service
docker-compose down -v           # Reset everything (deletes data!)
```

---

## 🎨 Code Conventions & Patterns

### React Component Patterns
- **Functional components with hooks** (no class components)
- **Context for global state** (AuthContext, ThemeContext)
- **Yup for form validation** with centralized config in `src/validation/`
- **CSS modules or component-specific CSS** files
- **PropTypes or JSDoc comments** for component documentation

### API Service Layer
- **All API calls through `src/services/api.js`** (HTTP client with token management)
- **Admin-specific calls through `src/services/adminAPI.js`**
- **Automatic token injection** from localStorage
- **Centralized error handling** with interceptors

### Backend Patterns
- **JWT authentication** with bcrypt password hashing
- **Middleware composition**: `requireAuth` → `requireAdmin` → `requireElevatedSession`
- **Ownership checks**: Users can only access own data, admins can access any
- **Audit logging**: All admin actions logged to `user_auth_logs`
- **No hard deletes**: Use `is_active` flag for soft deletes

### Database Conventions
- **UUIDs for primary keys** (not auto-increment integers)
- **Timestamps**: `created_at`, `updated_at` on all tables
- **Audit fields**: `created_by`, `updated_by` where applicable
- **User isolation**: Every table with user-generated content has `user_id`
- **Descriptive indexes**: Named `idx_table_column` for clarity

---

## ⚠️ Known Issues & Gotchas

### Critical Issues
1. **Client tests failing (116 tests)** - Missing context providers in test setup
2. **LoginRegister form NOT connected to backend** - Still only validates client-side
3. **No toast/notification system** - Users don't see API feedback
4. **Branch coverage extremely low (2.12%)** - Not testing conditional paths

### Common Pitfalls
- **Port conflicts**: Default ports 3000, 3001, 5432 - use `npm run check-ports` to check
- **Docker not running**: Server won't start - verify with `docker info`
- **Missing .env file**: Copy from `.env.example` before first run
- **Database not initialized**: Run `npm run db:init` before starting services
- **JWT_SECRET in production**: MUST change from default value
- **Admin password**: Default `Admin123!` MUST be changed after first login

### Testing Gotcas
- **Always wrap components with providers** (AuthContext, ThemeContext)
- **Mock elevated sessions** when testing admin operations
- **Test data cleanup** - Some integration tests may leave test data in DB

---

## 📚 Key Documentation Files

### Getting Started
- `README.md` - Project overview and quick start
- `docs/GETTING_STARTED.md` - Detailed setup instructions
- `docs/DOCKER_SETUP_GUIDE.md` - Docker-specific setup

### Features & Planning
- `docs/FEATURES_SUMMARY.md` - Complete feature status and roadmap (32 features tracked)
- `NEXT_STEPS.md` - Prioritized next steps with time estimates
- `docs/RBAC_IMPLEMENTATION_STATUS.md` - RBAC implementation details

### Technical Documentation
- `docs/DATABASE_SCHEMA.md` - Complete schema with relationships
- `docs/STORAGE_GUIDE.md` - Database, API schemas, client storage
- `docs/VALIDATION_GUIDE.md` - Form validation patterns

### Testing & Quality
- `docs/TESTING_GUIDE.md` - Comprehensive testing documentation
- `COMPREHENSIVE_TEST_REPORT.md` - Latest test results and coverage
- `TEST_RESULTS_REPORT.md` - Historical test results
- `COVERAGE_REPORT.md` - Coverage analysis

### Troubleshooting
- `docs/TROUBLESHOOTING.md` - Common issues and solutions
- `docs/COMMANDS.md` - Quick command reference

---

## 🔐 Security Considerations

### Production Checklist
- [ ] Change `JWT_SECRET` to strong random value (use `openssl rand -base64 32`)
- [ ] Change default admin password immediately after first login
- [ ] Use strong database passwords (not `spexture_password`)
- [ ] Enable HTTPS/SSL for all connections
- [ ] Never commit `.env` file to version control (already in `.gitignore`)
- [ ] Restrict database access to application only
- [ ] Set up rate limiting for API endpoints
- [ ] Implement CSRF protection for state-changing operations
- [ ] Sanitize all user inputs before display (prevent XSS)
- [ ] Review and enable CORS restrictions for production

### Current Security Features
✅ bcrypt password hashing (10 rounds)
✅ JWT token expiration (24h default)
✅ Elevated session tokens for sensitive admin ops (15-min expiry)
✅ Audit logging for all authentication events
✅ Role-based access control (RBAC)
✅ Ownership checks on user data
✅ Input validation with Yup

❌ CSRF protection (not yet implemented)
❌ Rate limiting (not yet implemented)
❌ Input sanitization (not comprehensive)
❌ Security headers (not configured)

---

## 🎯 Immediate Next Steps for Claude

**Updated:** 2025-12-06 after completing authentication features

When working on this project, prioritize in this order:

### 1. ✅ COMPLETED: Authentication Features
All authentication high-priority items are complete:
- ✅ LoginRegister connected to backend API
- ✅ ProtectedRoute component implemented
- ✅ Protected routes applied in App.js

### 2. Verify Current Test Status (1-2 hours) 🔴
```bash
# Run tests to check current status
cd /Users/sbecker11/workspace-react/spexture-com
npm test -- --no-watch --verbose

# Review results and fix any actual failures
# Test report from Dec 3 may be outdated
# Goal: 95%+ pass rate
```

### 3. Manual Authentication Testing (1 hour) 🔴
```bash
# Start services
docker-compose up --build

# Test in browser at http://localhost:3000:
# - Register new user
# - Login with credentials
# - Try accessing /analyzer (should work when logged in)
# - Logout
# - Try /analyzer again (should redirect to login)
# - Test admin credentials: admin@spexture-com.local / Admin123!
```

### 4. Add Toast Notifications - ALREADY DONE ✅
Toast notifications are already implemented using react-toastify:
- Success/error messages for login/register
- API error handling
- User feedback for all auth actions

### 5. Complete JDAnalyzer Functionality (3-4 hours) 🟡
```javascript
// Implement word frequency analysis
// Add keyword extraction
// Connect to backend job_descriptions API
// Display analysis results
```

---

## 💡 Development Tips

### When Making Changes
1. **Read existing patterns** - Check similar components/routes before implementing
2. **Update tests** - Add tests for new functionality (aim for 70% coverage)
3. **Update documentation** - Keep docs in sync with code changes
4. **Check FEATURES_SUMMARY.md** - Mark completed items, add new ones
5. **Run tests before committing** - `npm run test:all`
6. **Test both roles** - Verify admin and user role behavior

### Quick Health Checks
```bash
# Is everything running?
curl http://localhost:3001/api/health

# Can I register?
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Test123!"}'

# Can I login?
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

### Where to Find Things
- **Components**: `src/components/*.js`
- **API calls**: `src/services/api.js`, `src/services/adminAPI.js`
- **Context/state**: `src/contexts/*.js`
- **Validation rules**: `src/validation/*.js`
- **Backend routes**: `server/src/routes/*.js`
- **Middleware**: `server/src/middleware/*.js`
- **Database schema**: `server/database/init.sql`, `server/database/migrations/`

---

## 🚨 Red Flags to Avoid

### Don't Do This:
- ❌ Access database directly without user_id filtering (security vulnerability)
- ❌ Store passwords in plain text (use bcrypt)
- ❌ Skip input validation on backend (never trust client-side validation alone)
- ❌ Hard delete users (use is_active flag)
- ❌ Allow users to set their own role (must be server-side only)
- ❌ Commit .env files or secrets to version control
- ❌ Skip elevated session checks for sensitive admin operations
- ❌ Forget to log admin actions in user_auth_logs

### Always Do This:
- ✅ Wrap React tests with providers (AuthContext, ThemeContext)
- ✅ Check ownership before allowing data access (user_id match or admin role)
- ✅ Validate all inputs on both client AND server
- ✅ Log security-relevant events (login, password changes, role changes)
- ✅ Use middleware composition for access control (requireAuth → requireAdmin → requireOwnership)
- ✅ Update FEATURES_SUMMARY.md when completing features
- ✅ Write tests for new functionality

---

## 📞 Getting Help

### Documentation References
- **Project-specific**: See `docs/` directory for comprehensive guides
- **React**: https://reactjs.org/docs/getting-started.html
- **React Router**: https://reactrouter.com/
- **Express.js**: https://expressjs.com/en/guide/routing.html
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Jest**: https://jestjs.io/docs/getting-started
- **Docker Compose**: https://docs.docker.com/compose/

### Common Questions
- **"Where should I add this feature?"** → Check `docs/FEATURES_SUMMARY.md` and `NEXT_STEPS.md`
- **"How do I test admin functionality?"** → See `docs/TESTING_GUIDE.md` and `docs/ADMIN_TESTING_GUIDE.md`
- **"What's the database schema?"** → See `docs/DATABASE_SCHEMA.md`
- **"How do I run migrations?"** → `npm run db:migrate`
- **"Tests are failing!"** → Check if providers are wrapped in test setup

---

**Remember**: The backend is ready and waiting. Priority #1 is connecting the React client to it!
