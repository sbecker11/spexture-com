# Spexture-com Server

Express.js REST API server with PostgreSQL database.

## Structure

```
server/
├── src/
│   ├── index.js              # Main server file
│   ├── database/
│   │   └── connection.js     # PostgreSQL connection pool
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   └── routes/
│       ├── auth.js           # Authentication routes (register, login)
│       └── users.js          # User CRUD routes
├── database/
│   └── init.sql              # Database schema initialization
├── package.json
├── Dockerfile
└── README.md
```

## Environment Variables

Create a `.env` file in the server directory or use docker-compose environment variables:

```env
NODE_ENV=development
PORT=3001

DB_HOST=postgres
DB_PORT=5432
DB_USER=spexture_user
DB_PASSWORD=spexture_password
DB_NAME=spexture_com

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

CLIENT_URL=http://localhost:3000
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users (Requires Authentication)

- `GET /api/users` - Get all users
- `GET /api/users/me` - Get current user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Development

Run with Docker Compose (recommended):
```bash
docker-compose up server
```

Or run locally:
```bash
npm install
npm run dev
```

