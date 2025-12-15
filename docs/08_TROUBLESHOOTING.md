# 🆘 Troubleshooting Guide

Common issues and solutions for the Spexture-com application.

---

## Docker Desktop Issues

### Docker Desktop Not Running

The `db:init` script will automatically try to start Docker Desktop on macOS. If it fails:

1. Manually open Docker Desktop application
2. Wait for it to fully start (whale icon in menu bar)
3. Run your command again

### Docker Container Won't Start

**Check logs:**
```bash
docker-compose logs <service-name>
```

**Rebuild containers:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

## Port Already in Use

If you get "port already in use" errors:

**Check what's using the port:**
```bash
lsof -i :3000  # React client
lsof -i :3001  # API server
lsof -i :5432  # PostgreSQL
```

**Solutions:**

1. **Stop the process:**
   ```bash
   kill -9 <PID>  # Replace <PID> with actual process ID
   ```

2. **Change ports in `.env` file:**
   ```env
   CLIENT_PORT=3002
   SERVER_PORT=3003
   POSTGRES_PORT=5433
   ```

3. **Stop conflicting services:**
   - Check if other Docker containers are using the ports
   - Check if other development servers are running

---

## Database Connection Errors

### Database Container Not Running

**Check status:**
```bash
docker-compose ps postgres
npm run db:status
```

**View logs:**
```bash
docker-compose logs postgres
npm run db:logs
```

**Restart database:**
```bash
docker-compose restart postgres
npm run db:restart
```

**Reinitialize database (⚠️ deletes all data):**
```bash
docker-compose down -v
npm run db:init
```

### Database Connection Timeout

1. Ensure Docker Desktop is fully started
2. Wait a few seconds after starting the container
3. Check if the database is ready:
   ```bash
   docker-compose exec postgres pg_isready -U spexture_user
   ```

---

## Module Not Found Errors

### Server Dependencies

```bash
cd server
npm install
docker-compose restart server
```

### Client Dependencies

```bash
npm install
docker-compose restart client
```

### Clear Node Modules and Reinstall

```bash
# Client
rm -rf node_modules package-lock.json
npm install

# Server
cd server
rm -rf node_modules package-lock.json
npm install
```

---

## Tests Failing

### Jest Cache Issues

**Clear Jest cache:**
```bash
# Client
npm test -- --clearCache

# Server
cd server && npm test -- --clearCache
```

### Database Not Available for Server Tests

Server API integration tests require PostgreSQL to be running:

```bash
# Start database
npm run db:init

# Then run tests
cd server && npm test
```

### Test Timeout Errors

**Increase timeout:**
- Check `jest.config.js` or `server/jest.config.js`
- Increase `testTimeout` value (default is 5000ms)

### Module Resolution Errors

**Check:**
1. All dependencies are installed (`npm install`)
2. Node modules are in correct location
3. Path aliases are correctly configured

---

## API Issues

### API Requests Return 404

**Check:**
1. Server container is running: `docker-compose ps server`
2. Server logs show no errors: `docker-compose logs server`
3. API URL is correct: `http://localhost:3001/api`
4. `.env` file has correct `REACT_APP_API_URL`

### API Returns 500 Errors

**Check server logs:**
```bash
docker-compose logs server
```

**Common causes:**
- Database connection issues
- Missing environment variables
- Invalid JWT tokens
- Database schema not initialized

### CORS Errors

CORS is enabled for development. If you see CORS errors:
1. Check server logs for CORS configuration
2. Verify API URL in `.env` matches the server URL
3. Ensure server is running and accessible

---

## React App Issues

### React App Shows "Cannot GET /"

**This is normal!** React Router handles client-side routing. The development server should handle this automatically.

### Hot Reload Not Working

1. Check if client container is running: `docker-compose ps client`
2. Restart client: `docker-compose restart client`
3. Clear browser cache
4. Check client logs: `docker-compose logs client`

### React App Won't Load

1. Check client container status: `docker-compose ps client`
2. View client logs: `docker-compose logs client`
3. Check for build errors in logs
4. Try rebuilding: `docker-compose up --build client`

---

## Authentication Issues

### JWT Token Errors

**Check:**
1. `JWT_SECRET` is set in `.env` file
2. Token hasn't expired
3. Token is being sent in Authorization header

**Format:**
```
Authorization: Bearer <token>
```

### Login/Register Fails

1. Check server logs for errors
2. Verify database is running and accessible
3. Check request format matches API expectations
4. Verify password meets requirements

---

## Database Data Issues

### Data Not Persisting

**Check:**
1. Database volume is mounted correctly
2. Container isn't being recreated with `docker-compose down -v`
3. Database schema is initialized

### Reset Database

**⚠️ WARNING: This deletes all data!**

```bash
docker-compose down -v
npm run db:init
```

### Backup Database

```bash
docker-compose exec postgres pg_dump -U spexture_user spexture_com > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U spexture_user spexture_com < backup.sql
```

---

## Environment Variables

### Variables Not Loading

1. Ensure `.env` file exists in project root
2. Check file format (no spaces around `=`)
3. Restart services after changing `.env`:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### Required Variables

Check that these are set in `.env`:
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `SERVER_PORT`
- `CLIENT_PORT`
- `JWT_SECRET`

---

## Performance Issues

### Slow Container Startup

**First time:** Takes 2-5 minutes (building images)
**Subsequent:** Should be 30-60 seconds

If slow:
1. Check Docker Desktop resources (CPU/RAM allocation)
2. Ensure Docker Desktop is not paused
3. Clear Docker cache: `docker system prune`

### Slow Test Execution

1. Run tests without watch mode
2. Run specific test files instead of all tests
3. Increase Jest timeout if tests are timing out
4. Check database connection for server tests

---

## Still Having Issues?

1. **Check all logs:**
   ```bash
   docker-compose logs
   ```

2. **Verify services are running:**
   ```bash
   docker-compose ps
   ```

3. **Review documentation:**
   - [`GETTING_STARTED.md`](GETTING_STARTED.md)
   - [`DOCKER_SETUP_GUIDE.md`](DOCKER_SETUP_GUIDE.md)
   - [`TESTING_GUIDE.md`](TESTING_GUIDE.md)

4. **Check system requirements:**
   - Docker Desktop version 20.10+
   - Node.js (for local development)
   - Sufficient disk space for Docker images

---

## Quick Diagnostic Commands

```bash
# Check all container statuses
docker-compose ps

# Check Docker version
docker --version
docker-compose --version

# View all logs
docker-compose logs

# Check database connection
docker-compose exec postgres pg_isready -U spexture_user

# Test API health
curl http://localhost:3001/health

# Check port usage
lsof -i :3000  # Client
lsof -i :3001  # Server
lsof -i :5432  # Database
```

