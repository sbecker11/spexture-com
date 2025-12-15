/**
 * Admin Routes Unit Tests
 * Tests admin route handlers with mocked dependencies
 * Focuses on error paths and edge cases not covered by integration tests
 */

const express = require('express');
const request = require('supertest');

// Mock dependencies BEFORE requiring routes
// Create the mock function that we can control
const mockQuery = jest.fn();

// Admin routes does: const pool = require('../database/connection')
// So pool is the entire module { pool, query, getClient }
// And it uses pool.query(...) which is the helper query function
jest.mock('../../database/connection', () => {
  return {
    pool: {
      query: jest.fn(), // This is the actual pool.query (not used by admin.js)
    },
    query: mockQuery, // This is what admin.js uses when it calls pool.query(...)
    getClient: jest.fn(),
  };
});

jest.mock('../../middleware/rbac', () => ({
  requireAdmin: (req, res, next) => {
    // Mock requireAdmin - just pass through
    next();
  },
  requireElevatedSession: (req, res, next) => {
    // Mock requireElevatedSession - just pass through
    next();
  },
  logAdminAction: jest.fn().mockResolvedValue(),
  generateElevatedToken: jest.fn(() => ({
    token: 'mock-elevated-token',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  })),
}));

jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    // Mock authenticateToken - set req.user
    req.user = {
      id: 'admin-user-id',
      email: 'admin@example.com',
      role: 'admin',
    };
    next();
  },
}));

// Require routes AFTER mocks are set up
// Note: admin.js does: const pool = require('../database/connection')
// So pool is the entire module object
const adminRoutes = require('../../routes/admin');
const connectionModule = require('../../database/connection');
const bcrypt = require('bcryptjs');

// Ensure connectionModule.query is our mock
// This is what admin.js uses when it calls pool.query(...)
connectionModule.query = mockQuery;

describe('Admin Routes Unit Tests', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock query function
    mockQuery.mockClear();
    // Ensure connectionModule.query is our mock
    // This is what admin.js uses when it calls pool.query(...)
    connectionModule.query = mockQuery;
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
  });

  describe('POST /api/admin/verify-password', () => {
    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/admin/verify-password')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Password required');
      expect(response.body).toHaveProperty('code', 'PASSWORD_REQUIRED');
    });

    it('should return 404 if user not found', async () => {
      // Mock the query to return empty rows (user not found)
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/admin/verify-password')
        .send({ password: 'testpassword' })
        .expect(404);
      expect(response.body).toHaveProperty('error', 'User not found');
      expect(response.body).toHaveProperty('code', 'USER_NOT_FOUND');
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT password_hash FROM users WHERE id = $1',
        ['admin-user-id']
      );
    });

    it('should return 401 if password is invalid', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 10);
      // Mock the query to return a user with password hash
      mockQuery.mockResolvedValueOnce({
        rows: [{ password_hash: passwordHash }],
      });

      const response = await request(app)
        .post('/api/admin/verify-password')
        .send({ password: 'wrongpassword' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid password');
      expect(response.body).toHaveProperty('code', 'INVALID_PASSWORD');
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT password_hash FROM users WHERE id = $1',
        ['admin-user-id']
      );
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/admin/verify-password')
        .send({ password: 'testpassword' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to verify password');
      expect(response.body).toHaveProperty('code', 'VERIFICATION_ERROR');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should handle database error gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/admin/users')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to list users');
      expect(response.body).toHaveProperty('code', 'LIST_USERS_ERROR');
    });

    it('should handle stats query failure gracefully', async () => {
      // Mock count query (first call)
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '2' }],
      });

      // Mock users query (second call)
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: '1', name: 'User 1', email: 'user1@example.com', role: 'user', is_active: true },
          { id: '2', name: 'User 2', email: 'user2@example.com', role: 'user', is_active: true },
        ],
      });

      // Mock stats query failure (third call) - but it's wrapped in try-catch, so it should continue
      mockQuery.mockRejectedValueOnce(new Error('Stats table does not exist'));

      const response = await request(app)
        .get('/api/admin/users')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body.users).toHaveLength(2);
      // Should have default stats even if stats query fails
      expect(response.body.users[0]).toHaveProperty('stats');
      expect(response.body.users[0].stats.jobDescriptionsCount).toBe(0);
    });

    it('should handle empty user list', async () => {
      // Mock count query (first call)
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '0' }],
      });

      // Mock users query (second call) - empty result
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      // No stats query since userIds.length === 0

      const response = await request(app)
        .get('/api/admin/users')
        .expect(200);

      expect(response.body.users).toHaveLength(0);
      expect(response.body.pagination.totalCount).toBe(0);
      expect(response.body.pagination.totalPages).toBe(0);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return 404 if user not found', async () => {
      // Mock user query - user not found
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app)
        .get('/api/admin/users/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
      expect(response.body).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    it('should handle stats query failure gracefully', async () => {
      // Mock user query (first call)
      mockQuery.mockResolvedValueOnce({
        rows: [{ 
          id: '1', 
          name: 'User 1', 
          email: 'user1@example.com',
          role: 'user',
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }],
      });

      // Mock stats query failure (second call) - wrapped in try-catch
      mockQuery.mockRejectedValueOnce(new Error('Stats table error'));

      // Mock activity query (third call)
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app)
        .get('/api/admin/users/user-id')
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats.jobDescriptionsCount).toBe(0);
      expect(response.body.stats.resumesCount).toBe(0);
      expect(response.body.stats.coverLettersCount).toBe(0);
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/admin/users/user-id')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to get user');
      expect(response.body).toHaveProperty('code', 'GET_USER_ERROR');
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('should return 400 if role is invalid', async () => {
      const response = await request(app)
        .put('/api/admin/users/user-id/role')
        .send({ role: 'invalid_role' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid role. Must be "admin" or "user"');
      expect(response.body).toHaveProperty('code', 'INVALID_ROLE');
    });

    it('should return 400 if admin tries to change own role', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ name: 'Admin', email: 'admin@example.com', role: 'admin' }],
      });

      const response = await request(app)
        .put('/api/admin/users/admin-user-id/role')
        .send({ role: 'user' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Cannot change your own role');
      expect(response.body).toHaveProperty('code', 'CANNOT_CHANGE_OWN_ROLE');
    });

    it('should return 404 if user not found', async () => {
      // Ensure mock is reset
      mockQuery.mockReset();
      // Mock the SELECT query to return empty rows (user not found)
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app)
        .put('/api/admin/users/non-existent-id/role')
        .send({ role: 'admin' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
      expect(response.body).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ name: 'User', email: 'user@example.com', role: 'user' }],
      });
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .put('/api/admin/users/user-id/role')
        .send({ role: 'admin' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to update user role');
      expect(response.body).toHaveProperty('code', 'UPDATE_ROLE_ERROR');
    });
  });

  describe('PUT /api/admin/users/:id/password', () => {
    it('should return 400 if password is too short', async () => {
      const response = await request(app)
        .put('/api/admin/users/user-id/password')
        .send({ newPassword: 'short' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Password must be at least 8 characters');
      expect(response.body).toHaveProperty('code', 'INVALID_PASSWORD');
    });

    it('should return 404 if user not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app)
        .put('/api/admin/users/non-existent-id/password')
        .send({ newPassword: 'NewPassword123!' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
      expect(response.body).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ email: 'user@example.com' }],
      });
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .put('/api/admin/users/user-id/password')
        .send({ newPassword: 'NewPassword123!' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to reset user password');
      expect(response.body).toHaveProperty('code', 'RESET_PASSWORD_ERROR');
    });
  });

  describe('PUT /api/admin/users/:id/status', () => {
    it('should return 400 if is_active is not a boolean', async () => {
      const response = await request(app)
        .put('/api/admin/users/user-id/status')
        .send({ is_active: 'not-a-boolean' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'is_active must be a boolean');
      expect(response.body).toHaveProperty('code', 'INVALID_STATUS');
    });

    it('should return 400 if admin tries to change own status', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ email: 'admin@example.com', is_active: true }],
      });

      const response = await request(app)
        .put('/api/admin/users/admin-user-id/status')
        .send({ is_active: false })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Cannot change your own account status');
      expect(response.body).toHaveProperty('code', 'CANNOT_CHANGE_OWN_STATUS');
    });

    it('should return 404 if user not found', async () => {
      // Ensure mock is reset
      mockQuery.mockReset();
      // Mock the SELECT query to return empty rows (user not found)
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app)
        .put('/api/admin/users/non-existent-id/status')
        .send({ is_active: false });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
      expect(response.body).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ email: 'user@example.com', is_active: true }],
      });
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .put('/api/admin/users/user-id/status')
        .send({ is_active: false })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to update user status');
      expect(response.body).toHaveProperty('code', 'UPDATE_STATUS_ERROR');
    });
  });

  describe('GET /api/admin/users/:id/activity', () => {
    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/admin/users/user-id/activity')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to get user activity');
      expect(response.body).toHaveProperty('code', 'GET_ACTIVITY_ERROR');
    });

    it('should handle pagination parameters', async () => {
      // Mock activity query
      mockQuery.mockResolvedValueOnce({
        rows: [
          { 
            id: '1', 
            action: 'login', 
            created_at: '2024-01-01',
            performed_by_name: 'Admin',
            performed_by_email: 'admin@example.com'
          },
        ],
      });
      // Mock count query
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '1' }],
      });

      const response = await request(app)
        .get('/api/admin/users/user-id/activity?limit=10&offset=0')
        .expect(200);

      expect(response.body).toHaveProperty('activity');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.offset).toBe(0);
    });
  });
});

