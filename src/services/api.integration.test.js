/**
 * API Service Integration Tests
 * Tests API service against real Docker server
 * 
 * Prerequisites:
 * - Docker Compose services must be running
 * - Run: npm run start:services:detached
 * - Or: docker compose up -d postgres && cd server && npm run dev
 */

import { authAPI, usersAPI, healthAPI } from './api';
import { skipIfServerUnavailable } from '../utils/serverCheck';

// Use real fetch (not mocked)
// Don't mock localStorage - use real one for integration tests

// Get API URL from environment
const API_URL = process.env.SPEXTURE_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3011/api';

describe('API Service Integration Tests', () => {
  let testUser = {
    name: 'Integration Test User',
    email: `integration-test-${Date.now()}@example.com`,
    password: 'IntegrationTest123!',
  };
  
  let authToken;
  let userId;
  let serverAvailable = false;

  // Check if server is available - skip all tests if not
  beforeAll(async () => {
    serverAvailable = await skipIfServerUnavailable();
  });

  // Helper function to skip test if server is not available
  const skipIfNoServer = () => {
    if (!serverAvailable) {
      console.log('⏭️  Skipping test - server not available');
      return true;
    }
    return false;
  };

  // Clean up test user after all tests
  afterAll(async () => {
    if (authToken && userId) {
      try {
        // Try to delete test user (may fail if already deleted)
        await fetch(`${API_URL}/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('healthAPI', () => {
    it('should check server health', async () => {
      if (skipIfNoServer()) return;
      
      const result = await healthAPI.check();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('message', 'Server is running');
    });
  });

  describe('authAPI', () => {
    describe('register', () => {
      it('should register a new user successfully', async () => {
        if (skipIfNoServer()) return;
        const result = await authAPI.register({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
        });

        expect(result).toHaveProperty('message', 'User registered successfully');
        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('user');
        expect(result.user).toHaveProperty('id');
        expect(result.user).toHaveProperty('name', testUser.name);
        expect(result.user).toHaveProperty('email', testUser.email);

        // Store token and user ID for later tests
        authToken = result.token;
        userId = result.user.id;

        // Store token in localStorage (as real app would)
        localStorage.setItem('token', authToken);
      });

      it('should reject duplicate email', async () => {
        if (skipIfNoServer()) return;
        await expect(
          authAPI.register({
            name: 'Another User',
            email: testUser.email, // Same email as above
            password: 'AnotherPassword123!',
          })
        ).rejects.toThrow();
      });

      it('should validate email format', async () => {
        if (skipIfNoServer()) return;
        await expect(
          authAPI.register({
            name: 'Test User',
            email: 'invalid-email',
            password: 'Password123!',
          })
        ).rejects.toThrow();
      });

      it('should validate password requirements', async () => {
        if (skipIfNoServer()) return;
        await expect(
          authAPI.register({
            name: 'Test User',
            email: 'test2@example.com',
            password: 'weak', // Too weak
          })
        ).rejects.toThrow();
      });
    });

    describe('login', () => {
      it('should login with valid credentials', async () => {
        if (skipIfNoServer()) return;
        const result = await authAPI.login(testUser.email, testUser.password);

        expect(result).toHaveProperty('message', 'Login successful');
        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('user');
        expect(result.user).toHaveProperty('email', testUser.email);

        // Update stored token
        authToken = result.token;
        localStorage.setItem('token', authToken);
      });

      it('should reject invalid email', async () => {
        if (skipIfNoServer()) return;
        await expect(
          authAPI.login('nonexistent@example.com', testUser.password)
        ).rejects.toThrow();
      });

      it('should reject invalid password', async () => {
        if (skipIfNoServer()) return;
        await expect(
          authAPI.login(testUser.email, 'WrongPassword123!')
        ).rejects.toThrow();
      });
    });
  });

  describe('usersAPI', () => {
    beforeEach(() => {
      // Ensure we have a token
      if (authToken) {
        localStorage.setItem('token', authToken);
      }
    });

    describe('getCurrent', () => {
      it('should get current user with valid token', async () => {
        if (skipIfNoServer()) return;
        const result = await usersAPI.getCurrent();

        expect(result).toHaveProperty('user');
        expect(result.user).toHaveProperty('id', userId);
        expect(result.user).toHaveProperty('email', testUser.email);
        expect(result.user).toHaveProperty('name', testUser.name);
      });

      it('should reject request without token', async () => {
        if (skipIfNoServer()) return;
        localStorage.removeItem('token');

        await expect(usersAPI.getCurrent()).rejects.toThrow();
      });
    });

    describe('getById', () => {
      it('should get user by ID with valid token', async () => {
        if (skipIfNoServer()) return;
        const result = await usersAPI.getById(userId);

        expect(result).toHaveProperty('user');
        expect(result.user).toHaveProperty('id', userId);
        expect(result.user).toHaveProperty('email', testUser.email);
      });

      it('should return 404 for non-existent user', async () => {
        if (skipIfNoServer()) return;
        const fakeId = '00000000-0000-0000-0000-000000000000';
        await expect(usersAPI.getById(fakeId)).rejects.toThrow();
      });
    });

    describe('update', () => {
      it('should update user with valid token', async () => {
        if (skipIfNoServer()) return;
        const updatedName = 'Updated Integration Test User';
        const result = await usersAPI.update(userId, {
          name: updatedName,
        });

        expect(result).toHaveProperty('message', 'User updated successfully');
        expect(result).toHaveProperty('user');
        expect(result.user).toHaveProperty('name', updatedName);

        // Restore original name for other tests
        await usersAPI.update(userId, {
          name: testUser.name,
        });
      });

      it('should update email with valid token', async () => {
        if (skipIfNoServer()) return;
        const newEmail = `updated-${Date.now()}@example.com`;
        const result = await usersAPI.update(userId, {
          email: newEmail,
        });

        expect(result.user).toHaveProperty('email', newEmail);

        // Update back to original email
        await usersAPI.update(userId, {
          email: testUser.email,
        });
      });

      it('should reject update with duplicate email', async () => {
        if (skipIfNoServer()) return;
        // Create another user first
        const otherUser = await authAPI.register({
          name: 'Other User',
          email: `other-${Date.now()}@example.com`,
          password: 'OtherPassword123!',
        });

        // Try to update with duplicate email
        await expect(
          usersAPI.update(userId, {
            email: otherUser.user.email,
          })
        ).rejects.toThrow();

        // Clean up other user
        try {
          await fetch(`${API_URL}/users/${otherUser.user.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${otherUser.token}`,
            },
          });
        } catch (error) {
          // Ignore cleanup errors
        }
      });
    });

    describe('getAll', () => {
      it('should get all users with valid token', async () => {
        if (skipIfNoServer()) return;
        const result = await usersAPI.getAll();

        expect(result).toHaveProperty('users');
        expect(Array.isArray(result.users)).toBe(true);
        expect(result.users.length).toBeGreaterThan(0);
      });
    });
  });
});

