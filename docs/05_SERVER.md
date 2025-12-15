# 🖥️ Server API Guide

Complete guide to the Express.js REST API server, including authentication, RBAC, and API endpoints.

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Server Architecture](#-server-architecture)
3. [Environment Configuration](#-environment-configuration)
4. [API Endpoints](#-api-endpoints)
5. [Authentication & JWT](#-authentication--jwt)
6. [RBAC (Role-Based Access Control)](#-rbac-role-based-access-control)
7. [Middleware](#-middleware)
8. [Error Handling](#-error-handling)
9. [Security Features](#-security-features)
10. [Testing the API](#-testing-the-api)

---

## 📊 Overview

The Spexture-com server is an Express.js REST API that provides:
- User authentication (registration, login)
- JWT-based session management
- Role-based access control (RBAC)
- User CRUD operations with ownership checks
- Admin user management with elevated sessions
- Comprehensive audit logging

### Key Features

- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **bcrypt Password Hashing** - 10 rounds of salting
- ✅ **RBAC** - Admin and user roles with different permissions
- ✅ **Elevated Sessions** - Re-authentication for sensitive admin operations
- ✅ **Audit Logging** - All auth events and admin actions logged
- ✅ **Ownership Checks** - Users can only access their own data
- ✅ **PostgreSQL Connection Pool** - Efficient database connections
- ✅ **CORS Enabled** - Cross-origin requests supported
- ✅ **Security Headers** - Helmet middleware for security

---

## 🏗️ Server Architecture

### Directory Structure

```
server/
├── src/
│   ├── index.js                    # Main server entry point
│   ├── database/
│   │   └── connection.js           # PostgreSQL connection pool
│   ├── middleware/
│   │   ├── auth.js                 # JWT authentication middleware
│   │   └── rbac.js                 # Role-based access control middleware
│   ├── routes/
│   │   ├── auth.js                 # Authentication routes
│   │   ├── users.js                # User CRUD routes
│   │   ├── admin.js                # Admin-only routes
│   │   └── coverage.js             # Test coverage route
│   ├── validation/
│   │   └── validationHelpers.js    # Input validation helpers
│   └── __tests__/                  # Test files
├── database/
│   ├── init.sql                    # Database schema
│   └── migrations/                 # Database migrations
├── package.json
├── Dockerfile
└── README.md
```

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ with pg driver
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **Security**: Helmet, CORS
- **Development**: nodemon for hot reload
- **Testing**: Jest + Supertest

---

## ⚙️ Environment Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
SPEXTURE_NODE_ENV=development
SPEXTURE_SERVER_PORT=3011

# Database Configuration (DB_* variables are set by docker-compose from SPEXTURE_POSTGRES_*)
DB_HOST=postgres
DB_PORT=5432  # Internal container port (host port is 5433)
DB_USER=spexture_user
DB_PASSWORD=spexture_password
DB_NAME=spexture_com

# JWT Configuration
SPEXTURE_JWT_SECRET=your-super-secret-jwt-key-change-in-production
SPEXTURE_JWT_EXPIRES_IN=24h

# Client Configuration
SPEXTURE_CLIENT_URL=http://localhost:3010
```

### Production Considerations

**⚠️ Critical for Production:**
1. **Change SPEXTURE_JWT_SECRET** to a strong random string:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. **Use strong database password** (not `spexture_password`)
3. **Set SPEXTURE_NODE_ENV=production**
4. **Enable HTTPS** and update CLIENT_URL
5. **Set up proper logging** (not just console.log)
6. **Implement rate limiting**
7. **Configure CORS** for specific origins only

---

## 🔌 API Endpoints

### Base URL

- **Development**: http://localhost:3011
- **API Base**: http://localhost:3011/api

### Health Check

#### GET `/health`

Check server health status.

**Request:**
```bash
curl http://localhost:3011/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

### Authentication Endpoints

#### POST `/api/auth/register`

Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** (201 Created):
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

**Validation Rules:**
- Name: Required, 2-100 characters
- Email: Required, valid email format, unique
- Password: Required, 8-50 characters, must include uppercase, lowercase, number, and special character

**Side Effects:**
- Creates user with 'user' role (default)
- Password hashed with bcrypt (10 rounds)
- Logs `registration` event in `user_auth_logs`

#### POST `/api/auth/login`

Login existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
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

**Error Responses:**
- 400: Invalid credentials
- 403: Account deactivated
- 429: Too many attempts (if rate limiting enabled)

**Side Effects:**
- Updates `last_login_at` timestamp
- Logs `login` event in `user_auth_logs`
- Failed attempts logged as `failed_login`

---

### User Endpoints

**Authentication Required**: All user endpoints require valid JWT token in `Authorization` header.

**Header Format:**
```
Authorization: Bearer <JWT_TOKEN>
```

#### GET `/api/users`

Get all users (admin only).

**Request:**
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3011/api/users
```

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "is_active": true,
    "last_login_at": "2024-12-01T10:30:00Z",
    "created_at": "2024-11-01T09:00:00Z"
  }
]
```

**Access Control:**
- Admin: Can view all users
- User: Returns 403 Forbidden

#### GET `/api/users/me`

Get current authenticated user profile.

**Request:**
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3011/api/users/me
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "is_active": true,
  "last_login_at": "2024-12-01T10:30:00Z",
  "created_at": "2024-11-01T09:00:00Z",
  "updated_at": "2024-11-01T09:00:00Z"
}
```

#### GET `/api/users/:id`

Get user by ID (ownership check or admin).

**Request:**
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3011/api/users/<USER_ID>
```

**Access Control:**
- User: Can only view own profile
- Admin: Can view any user

#### PUT `/api/users/:id`

Update user (ownership check or admin).

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "newemail@example.com"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "John Updated",
  "email": "newemail@example.com",
  "role": "user",
  "updated_at": "2024-12-01T11:00:00Z"
}
```

**Access Control:**
- User: Can only update own profile
- Admin: Can update any user

**Side Effects:**
- Sets `updated_by` to current user ID
- Updates `updated_at` timestamp

#### DELETE `/api/users/:id`

Delete user (soft delete - ownership check or admin).

**Request:**
```bash
curl -X DELETE -H "Authorization: Bearer <TOKEN>" http://localhost:3011/api/users/<USER_ID>
```

**Response** (204 No Content)

**Access Control:**
- User: Can only delete own account
- Admin: Can delete any user

**Note**: This is a soft delete (sets `is_active = false`).

---

### Admin Endpoints

**Authentication Required**: All admin endpoints require:
1. Valid JWT token with `role: admin`
2. Elevated session token for sensitive operations

**Elevated Session**: Required for operations marked with 🔒. Expires after 15 minutes.

#### POST `/api/admin/verify-password`

Verify admin password and get elevated session token.

**Request Body:**
```json
{
  "password": "Admin123!"
}
```

**Response** (200 OK):
```json
{
  "elevatedToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15m"
}
```

**Side Effects:**
- Creates temporary elevated session token
- Token expires after 15 minutes
- All elevated operations logged

#### GET `/api/admin/users`

List all users with filters, sorting, and pagination.

**Query Parameters:**
- `role` (string): Filter by role ('admin', 'user')
- `status` (string): Filter by status ('active', 'inactive')
- `search` (string): Search by name or email
- `sortBy` (string): Sort field (name, email, last_login_at, created_at)
- `sortOrder` (string): Sort order ('asc', 'desc')
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

**Request:**
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3011/api/admin/users?role=user&sortBy=last_login_at&sortOrder=desc&page=1&limit=10"
```

**Response** (200 OK):
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "is_active": true,
      "last_login_at": "2024-12-01T10:30:00Z",
      "created_at": "2024-11-01T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### GET `/api/admin/users/:id`

Get detailed user information (admin only).

**Request:**
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3011/api/admin/users/<USER_ID>
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "is_active": true,
  "last_login_at": "2024-12-01T10:30:00Z",
  "created_at": "2024-11-01T09:00:00Z",
  "updated_at": "2024-11-01T09:00:00Z",
  "created_by": "admin-uuid",
  "updated_by": "admin-uuid"
}
```

#### PUT `/api/admin/users/:id/role` 🔒

Change user role (requires elevated session).

**Headers:**
```
Authorization: Bearer <ADMIN_TOKEN>
X-Elevated-Token: <ELEVATED_TOKEN>
```

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response** (200 OK):
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "uuid",
    "role": "admin"
  }
}
```

**Validation:**
- Role must be 'user' or 'admin'
- Cannot change own role
- Requires valid elevated session

**Side Effects:**
- Logs `role_change` in `user_auth_logs`
- Sets `updated_by` to admin ID

#### PUT `/api/admin/users/:id/password` 🔒

Reset user password (requires elevated session).

**Headers:**
```
Authorization: Bearer <ADMIN_TOKEN>
X-Elevated-Token: <ELEVATED_TOKEN>
```

**Request Body:**
```json
{
  "newPassword": "NewSecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset successfully"
}
```

**Validation:**
- Password must meet strength requirements
- Cannot reset own password (use profile update instead)

**Side Effects:**
- Password hashed with bcrypt
- Logs `password_reset` in `user_auth_logs`
- User's old tokens remain valid (consider invalidating)

#### PUT `/api/admin/users/:id/status` 🔒

Activate or deactivate user account (requires elevated session).

**Headers:**
```
Authorization: Bearer <ADMIN_TOKEN>
X-Elevated-Token: <ELEVATED_TOKEN>
```

**Request Body:**
```json
{
  "isActive": false
}
```

**Response** (200 OK):
```json
{
  "message": "User status updated successfully",
  "user": {
    "id": "uuid",
    "is_active": false
  }
}
```

**Validation:**
- Cannot deactivate own account
- `isActive` must be boolean

**Side Effects:**
- Logs `account_deactivated` or `account_activated`
- Deactivated users cannot log in

#### GET `/api/admin/users/:id/activity`

Get user's authentication activity logs.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Request:**
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3011/api/admin/users/<USER_ID>/activity?page=1&limit=20"
```

**Response** (200 OK):
```json
{
  "activity": [
    {
      "id": "uuid",
      "action": "login",
      "success": true,
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-12-01T10:30:00Z"
    },
    {
      "id": "uuid",
      "action": "role_change",
      "success": true,
      "performed_by": "admin-uuid",
      "metadata": {"old_role": "user", "new_role": "admin"},
      "created_at": "2024-12-01T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

## 🔐 Authentication & JWT

### JWT Token Structure

**Standard JWT Token** (24h expiry):
```json
{
  "userId": "uuid",
  "role": "user",
  "iat": 1638360000,
  "exp": 1638446400
}
```

**Elevated Session Token** (15min expiry):
```json
{
  "userId": "uuid",
  "role": "admin",
  "elevated": true,
  "iat": 1638360000,
  "exp": 1638360900
}
```

### Token Usage

**Client-Side Storage:**
```javascript
// Store token
localStorage.setItem('token', response.token);

// Include in requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
};
```

**Token Expiration:**
- Standard token: 24 hours (configurable via JWT_EXPIRES_IN)
- Elevated token: 15 minutes (hardcoded for security)

### Password Requirements

**Validation Rules:**
- Minimum 8 characters
- Maximum 50 characters
- Must include:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (!@#$%^&*)

**bcrypt Hashing:**
- Salt rounds: 10
- One-way hashing (cannot be reversed)
- Comparison via bcrypt.compare()

---

## 🛡️ RBAC (Role-Based Access Control)

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **user** | Standard user | Own data only |
| **admin** | Administrator | All users, system management |

### Permission Matrix

| Operation | User | Admin |
|-----------|------|-------|
| Register | ✅ | ✅ |
| Login | ✅ | ✅ |
| View own profile | ✅ | ✅ |
| Update own profile | ✅ | ✅ |
| Delete own account | ✅ | ✅ |
| View all users | ❌ | ✅ |
| View other user profile | ❌ | ✅ |
| Update other user | ❌ | ✅ |
| Delete other user | ❌ | ✅ |
| Change user role | ❌ | ✅ (with elevated session) |
| Reset user password | ❌ | ✅ (with elevated session) |
| Activate/deactivate user | ❌ | ✅ (with elevated session) |
| View activity logs | ❌ | ✅ |

### Elevated Session Operations

These operations require admin to re-authenticate with password:

1. **Change User Role** - `PUT /api/admin/users/:id/role`
2. **Reset User Password** - `PUT /api/admin/users/:id/password`
3. **Change User Status** - `PUT /api/admin/users/:id/status`

**Why Elevated Sessions?**
- Prevents unauthorized access if admin leaves computer unlocked
- Ensures admin explicitly approves sensitive operations
- Reduces risk of CSRF attacks
- Provides additional security layer for critical operations

### Default Admin Account

**Email**: `admin@spexture-com.local`
**Password**: `Admin123!`

**⚠️ IMPORTANT**: Change this password immediately after first login!

---

## 🔧 Middleware

### Authentication Middleware

**File**: `server/src/middleware/auth.js`

#### `requireAuth`

Verifies JWT token and attaches user to request.

**Usage:**
```javascript
router.get('/protected', requireAuth, (req, res) => {
  // req.user is available here
});
```

**Checks:**
- Token exists in Authorization header
- Token is valid and not expired
- User exists in database
- User account is active (`is_active = true`)

### RBAC Middleware

**File**: `server/src/middleware/rbac.js`

#### `requireAdmin`

Ensures user has admin role.

**Usage:**
```javascript
router.get('/admin', requireAuth, requireAdmin, (req, res) => {
  // Only admins can access
});
```

#### `requireElevatedSession`

Requires valid elevated session token for sensitive operations.

**Usage:**
```javascript
router.put('/sensitive', requireAuth, requireAdmin, requireElevatedSession, (req, res) => {
  // Requires admin with elevated session
});
```

**Checks:**
- `X-Elevated-Token` header present
- Token is valid and not expired
- Token has `elevated: true` claim
- Token userId matches authenticated user

#### `requireOwnershipOrAdmin`

Allows users to access own data, admins to access any data.

**Usage:**
```javascript
router.get('/users/:id', requireAuth, requireOwnershipOrAdmin, (req, res) => {
  // Users can access own profile, admins can access any
});
```

**Logic:**
- If admin: Allow access
- If user ID matches request.params.id: Allow access
- Otherwise: Deny access (403 Forbidden)

#### `logAdminAction`

Logs admin actions to audit trail.

**Usage:**
```javascript
router.put('/role', requireAuth, requireAdmin, logAdminAction('role_change'), (req, res) => {
  // Action is logged before processing
});
```

**Logs to**: `user_auth_logs` table

#### `logAuthEvent`

Logs authentication events (login, register, failed login).

**Usage:**
```javascript
router.post('/login', logAuthEvent('login'), async (req, res) => {
  // Login attempt is logged
});
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST (create) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (email already exists) |
| 500 | Internal Server Error | Unexpected server errors |

### Error Response Format

```json
{
  "error": "User-friendly error message",
  "details": "More technical details (development only)"
}
```

### Common Error Scenarios

**401 Unauthorized:**
```json
{
  "error": "No token provided"
}
```

**403 Forbidden:**
```json
{
  "error": "Admin access required"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid email format"
}
```

**409 Conflict:**
```json
{
  "error": "Email already registered"
}
```

---

## 🔒 Security Features

### Implemented Security

1. **bcrypt Password Hashing** - 10 rounds of salting
2. **JWT Authentication** - Token-based sessions
3. **CORS** - Cross-origin resource sharing configured
4. **Helmet** - Security headers (XSS protection, CSP, etc.)
5. **Input Validation** - All inputs validated before processing
6. **SQL Injection Protection** - Parameterized queries only
7. **Audit Logging** - All auth events and admin actions logged
8. **Elevated Sessions** - Re-authentication for sensitive operations
9. **Soft Deletes** - User data preserved even when "deleted"
10. **Account Deactivation** - Prevents login without deleting data

### Security Best Practices

**✅ Do:**
- Use HTTPS in production
- Rotate SPEXTURE_JWT_SECRET regularly
- Implement rate limiting
- Add request logging
- Monitor authentication logs
- Set up intrusion detection
- Use strong passwords
- Keep dependencies updated

**❌ Don't:**
- Use default passwords in production
- Commit .env files to git
- Store tokens in cookies without httpOnly flag
- Trust client-side validation alone
- Allow weak passwords
- Forget to sanitize user inputs

---

## 🧪 Testing the API

### Health Check

```bash
curl http://localhost:3011/health
```

### Register User

```bash
curl -X POST http://localhost:3011/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### Login

```bash
curl -X POST http://localhost:3011/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### Get Current User

```bash
TOKEN="your_jwt_token_here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3011/api/users/me
```

### Admin Login

```bash
curl -X POST http://localhost:3011/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@spexture-com.local",
    "password": "Admin123!"
  }'
```

### List All Users (Admin)

```bash
ADMIN_TOKEN="your_admin_token_here"
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3011/api/admin/users
```

### Get Elevated Session (Admin)

```bash
curl -X POST http://localhost:3011/api/admin/verify-password \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "Admin123!"}'
```

### Change User Role (Admin with Elevated Session)

```bash
ELEVATED_TOKEN="your_elevated_token_here"
curl -X PUT http://localhost:3011/api/admin/users/<USER_ID>/role \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "X-Elevated-Token: $ELEVATED_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

---

## 📚 Additional Resources

### Internal Documentation
- **Database**: See [`03_DATABASE.md`](./03_DATABASE.md) for database schema
- **Client**: See [`05_CLIENT.md`](./05_CLIENT.md) for React client integration
- **Testing**: See [`06_TESTING.md`](./06_TESTING.md) for API testing
- **Docker**: See [`02_DOCKER.md`](./02_DOCKER.md) for containerization

### External Resources
- [Express.js Documentation](https://expressjs.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)
- [Helmet Documentation](https://helmetjs.github.io/)

---

**Server Status**: ✅ Production Ready
**RBAC Status**: ✅ Phase 1 Complete
**Security Level**: 🛡️ Enhanced
