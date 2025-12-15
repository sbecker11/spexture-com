/**
 * Server API Integration Tests
 * Tests API endpoints with actual Express server
 */

const request = require('supertest');
const app = require('../index');
const { query } = require('../database/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPassword123!',
};

let authToken;
let userId;

describe('API Integration Tests', () => {
  // Clean up database before and after tests
  beforeAll(async () => {
    // Clean up any existing test users
    try {
      await query('DELETE FROM users WHERE email IN ($1, $2, $3, $4, $5, $6, $7)', [
        testUser.email,
        'other@example.com',
        'duplicate@example.com',
        'otheruser@example.com',
        'otherdelete@example.com',
        'updated@example.com',
        'delete@example.com'
      ]);
    } catch (error) {
      // Ignore if table doesn't exist yet
    }
  });

  afterAll(async () => {
    // Clean up test users
    try {
      await query('DELETE FROM users WHERE email IN ($1, $2, $3, $4, $5, $6, $7)', [
        testUser.email,
        'other@example.com',
        'duplicate@example.com',
        'otheruser@example.com',
        'otherdelete@example.com',
        'updated@example.com',
        'delete@example.com'
      ]);
    } catch (error) {
      // Ignore errors
    }
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('message', 'Server is running');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('name', testUser.name);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('password_hash');

      // Store token and userId for later tests
      authToken = response.body.token;
      userId = response.body.user.id;
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: testUser.email, // Same email
          password: 'AnotherPassword123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'User with this email already exists');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid User',
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should validate password requirements', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Weak Password User',
          email: 'weak@example.com',
          password: 'weak', // Too weak
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should validate name requirements', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'A', // Too short
          email: 'shortname@example.com',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Missing Fields',
          // Missing email and password
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', userId);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/users/me', () => {
    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', userId);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('name', testUser.name);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by ID with valid token', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', userId);
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should reject access to other user\'s profile', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Other User',
          email: 'other@example.com',
          password: 'OtherPassword123!',
        })
        .expect(201);

      const otherUserId = otherUserResponse.body.user.id;
      const otherUserToken = otherUserResponse.body.token;

      // Try to access original user's profile with other user's token
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied. You can only access your own data.');

      // Clean up
      await query('DELETE FROM users WHERE id = $1', [otherUserId]);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user with valid token', async () => {
      const updatedName = 'Updated Test User';
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: updatedName,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User updated successfully');
      expect(response.body.user).toHaveProperty('name', updatedName);
    });

    it('should update email with valid token', async () => {
      const newEmail = 'updated@example.com';
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: newEmail,
        })
        .expect(200);

      expect(response.body.user).toHaveProperty('email', newEmail);

      // Update back for other tests
      await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: testUser.email,
        });
    });

    it('should reject update with duplicate email', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Email User',
          email: 'duplicate@example.com',
          password: 'DuplicatePassword123!',
        })
        .expect(201);

      const otherUserId = otherUserResponse.body.user.id;
      const otherUserEmail = otherUserResponse.body.user.email;

      // Try to update current user with other user's email
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: otherUserEmail,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email already in use');

      // Clean up
      await query('DELETE FROM users WHERE id = $1', [otherUserId]);
    });

    it('should reject update from other user', async () => {
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Other User',
          email: 'otheruser@example.com',
          password: 'OtherPassword123!',
        })
        .expect(201);

      const otherUserId = otherUserResponse.body.user.id;
      const otherUserToken = otherUserResponse.body.token;

      // Try to update original user with other user's token
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          name: 'Hacked Name',
        })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied. You can only access your own data.');

      // Clean up
      await query('DELETE FROM users WHERE id = $1', [otherUserId]);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user with valid token', async () => {
      // Create a user to delete
      const deleteUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User To Delete',
          email: 'delete@example.com',
          password: 'DeletePassword123!',
        })
        .expect(201);

      const deleteUserId = deleteUserResponse.body.user.id;
      const deleteUserToken = deleteUserResponse.body.token;

      // Delete the user
      const response = await request(app)
        .delete(`/api/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${deleteUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User deleted successfully');

      // Verify user is deleted
      // Note: After deletion, the token becomes invalid because the user no longer exists
      // The authentication middleware returns 401 before the route handler can return 404
      const verifyResponse = await request(app)
        .get(`/api/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${deleteUserToken}`)
        .expect(401); // Authentication fails because user was deleted
    });

    it('should reject delete from other user', async () => {
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Other User',
          email: 'otherdelete@example.com',
          password: 'OtherPassword123!',
        })
        .expect(201);

      const otherUserId = otherUserResponse.body.user.id;
      const otherUserToken = otherUserResponse.body.token;

      // Try to delete original user with other user's token
      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied. You can only access your own data.');

      // Clean up
      await query('DELETE FROM users WHERE id = $1', [otherUserId]);
    });
  });

  describe('GET /api/users', () => {
    it('should get all users with valid token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
    });
  });
});

