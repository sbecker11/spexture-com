# Environment Variables - Complete Isolation Guide

## ✅ Implementation Complete

**spexture-com** now uses **project-specific prefixed environment variables** (`SPEXTURE_` prefix) to ensure complete isolation from other projects like `react-super-app`.

## Variable Naming Convention

All environment variables use the `SPEXTURE_` prefix:

| Variable | spexture-com | react-super-app |
|----------|--------------|-----------------|
| `SPEXTURE_POSTGRES_USER` | `spexture_user` | N/A (uses different prefix) |
| `SPEXTURE_POSTGRES_PASSWORD` | `spexture_password` | N/A |
| `SPEXTURE_POSTGRES_DB` | `spexture_com` | N/A |
| `SPEXTURE_POSTGRES_PORT` | `5433` | N/A |
| `SPEXTURE_SERVER_PORT` | `3011` | N/A |
| `SPEXTURE_CLIENT_PORT` | `3010` | N/A |
| `SPEXTURE_APP_API_URL` | `http://localhost:3011/api` | N/A |
| `SPEXTURE_JWT_SECRET` | (configurable) | N/A |
| `SPEXTURE_NODE_ENV` | `development` | N/A |
| `SPEXTURE_APP_ENV` | `development` | N/A |
| `SPEXTURE_APP_ADMIN_EMAIL` | `admin@spexture-com.local` | N/A |
| `SPEXTURE_APP_ADMIN_PASSWORD` | `Admin123!` | N/A |

## Complete Variable List

### Database Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SPEXTURE_POSTGRES_USER` | `spexture_user` | PostgreSQL username |
| `SPEXTURE_POSTGRES_PASSWORD` | `spexture_password` | PostgreSQL password |
| `SPEXTURE_POSTGRES_DB` | `spexture_com` | Database name |
| `SPEXTURE_POSTGRES_PORT` | `5433` | PostgreSQL port (5432 reserved for react-super-app) |
| `SPEXTURE_DB_HOST` | `localhost` | Database host (optional, for external databases) |

### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SPEXTURE_SERVER_PORT` | `3011` | Express server port (3001 reserved for react-super-app) |
| `SPEXTURE_NODE_ENV` | `development` | Node environment (`development`, `production`, `test`) |
| `SPEXTURE_JWT_SECRET` | `your-super-secret-jwt-key-change-in-production` | **⚠️ CHANGE IN PRODUCTION!** JWT signing key |
| `SPEXTURE_JWT_EXPIRES_IN` | `24h` | JWT token expiration time |
| `SPEXTURE_CLIENT_URL` | `http://localhost:3010` | Client URL (for CORS configuration) |

### Client Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SPEXTURE_CLIENT_PORT` | `3010` | React app port (3000 reserved for react-super-app) |
| `SPEXTURE_APP_API_URL` | `http://localhost:3011/api` | Backend API URL |
| `SPEXTURE_APP_ENV` | `development` | Client environment |
| `SPEXTURE_APP_ADMIN_EMAIL` | `admin@spexture-com.local` | Admin email (for dev auto-fill shortcut) |
| `SPEXTURE_APP_ADMIN_PASSWORD` | `Admin123!` | Admin password (for dev auto-fill shortcut) |

## Example `.env` File

**spexture-com/.env:**
```bash
# Database Configuration
SPEXTURE_POSTGRES_USER=spexture_user
SPEXTURE_POSTGRES_PASSWORD=spexture_password
SPEXTURE_POSTGRES_DB=spexture_com
SPEXTURE_POSTGRES_PORT=5433

# Server Configuration
SPEXTURE_SERVER_PORT=3011
SPEXTURE_NODE_ENV=development
SPEXTURE_JWT_SECRET=your-super-secret-jwt-key-change-in-production
SPEXTURE_JWT_EXPIRES_IN=24h

# Client Configuration
SPEXTURE_CLIENT_PORT=3010
SPEXTURE_APP_API_URL=http://localhost:3011/api
SPEXTURE_APP_ENV=development
SPEXTURE_APP_ADMIN_EMAIL=admin@spexture-com.local
SPEXTURE_APP_ADMIN_PASSWORD=Admin123!
```

## How It Works

### Docker Compose Mapping

Docker Compose maps `SPEXTURE_*` variables to internal container variables:

```yaml
environment:
  POSTGRES_USER: ${SPEXTURE_POSTGRES_USER:-spexture_user}
  PORT: ${SPEXTURE_SERVER_PORT:-3011}
  DB_USER: ${SPEXTURE_POSTGRES_USER:-spexture_user}
  # ... etc
```

### Code Fallback Support

All code files support both prefixed and non-prefixed variables for backward compatibility:

```javascript
// Server code example
const PORT = process.env.PORT || process.env.SPEXTURE_SERVER_PORT || 3011;

// Client code example
const API_URL = process.env.SPEXTURE_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3011/api';
```

This means:
- ✅ Docker Compose sets internal variables from `SPEXTURE_*` variables
- ✅ Code can read either prefixed or non-prefixed variables
- ✅ Complete isolation when using `SPEXTURE_*` variables
- ✅ Backward compatibility if old variables are set

## Benefits

### ✅ Complete Isolation

- **No conflicts** with `react-super-app` or any other project
- **Safe global exports** - You can export `SPEXTURE_*` variables without affecting other projects
- **Clear ownership** - Variable names clearly indicate which project they belong to

### ✅ Easy Identification

- **Window/tab names** include port numbers: `spexture-com:server:3011`
- **Environment variables** clearly prefixed: `SPEXTURE_*`
- **Container names** prefixed: `spexture_com_*`

### ✅ Production Ready

- **No accidental conflicts** in production environments
- **Clear configuration** - Easy to see which variables belong to which project
- **Scalable** - Easy to add more projects without conflicts

## Migration Guide

If you have an existing `.env` file with old variable names:

1. **Rename variables** in your `.env` file:
   ```bash
   # Old → New
   POSTGRES_USER → SPEXTURE_POSTGRES_USER
   POSTGRES_PASSWORD → SPEXTURE_POSTGRES_PASSWORD
   POSTGRES_DB → SPEXTURE_POSTGRES_DB
   POSTGRES_PORT → SPEXTURE_POSTGRES_PORT
   SERVER_PORT → SPEXTURE_SERVER_PORT
   CLIENT_PORT → SPEXTURE_CLIENT_PORT
   REACT_APP_API_URL → SPEXTURE_APP_API_URL
   JWT_SECRET → SPEXTURE_JWT_SECRET
   JWT_EXPIRES_IN → SPEXTURE_JWT_EXPIRES_IN
   NODE_ENV → SPEXTURE_NODE_ENV
   REACT_APP_ENV → SPEXTURE_APP_ENV
   REACT_APP_ADMIN_EMAIL → SPEXTURE_APP_ADMIN_EMAIL
   REACT_APP_ADMIN_PASSWORD → SPEXTURE_APP_ADMIN_PASSWORD
   ```

2. **Or use the example file**:
   ```bash
   cp .env.example .env
   # Then customize as needed
   ```

## Troubleshooting

### Issue: Wrong user/database being used

**Symptoms:**
- Migration fails with "role does not exist"
- Connection errors with wrong credentials

**Solution:**
1. Check your `.env` file: `cat .env | grep SPEXTURE_POSTGRES`
2. Verify variables are prefixed: `env | grep SPEXTURE_POSTGRES`
3. Unset any old non-prefixed variables: `unset POSTGRES_USER POSTGRES_PASSWORD`
4. Restart Docker containers: `docker compose down && docker compose up -d`

### Issue: Port conflicts

**Symptoms:**
- "Port already in use" errors
- Services starting on wrong ports

**Solution:**
1. Check which project is using the port: `lsof -i :3011`
2. Verify `.env` has correct prefixed variables: `grep SPEXTURE_SERVER_PORT .env`
3. Use different ports if needed: `SPEXTURE_SERVER_PORT=3012`

### Issue: Old variables still being used

**Symptoms:**
- Scripts or code using old variable names

**Solution:**
1. All code has been updated to support `SPEXTURE_*` variables
2. Docker Compose uses `SPEXTURE_*` variables
3. Scripts load `.env` which should have `SPEXTURE_*` variables
4. If issues persist, check for hardcoded values or old `.env` files

## Summary

**Status**: ✅ **Fully Isolated** - All environment variables use `SPEXTURE_` prefix for complete isolation.

**Recommendation**: Always use `SPEXTURE_*` prefixed variables in your `.env` file. The code supports both prefixed and non-prefixed variables for backward compatibility, but using the prefix ensures complete isolation.
