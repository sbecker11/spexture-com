/**
 * Admin API Service Tests
 */

import { adminAPI } from './adminAPI';

// Mock fetch globally
global.fetch = jest.fn();

describe('Admin API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    global.fetch.mockClear();
  });

  describe('getHeaders', () => {
    it('should include Authorization header when token exists', async () => {
      localStorage.setItem('token', 'test-token');
      
      // Mock fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ users: [], pagination: {} }),
      });
      
      // Call a method that uses getHeaders
      await adminAPI.listUsers();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should not include Authorization header when token does not exist', async () => {
      localStorage.removeItem('token');
      
      // Mock fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ users: [], pagination: {} }),
      });
      
      await adminAPI.listUsers();
      
      const callArgs = global.fetch.mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers).not.toHaveProperty('Authorization');
    });

    it('should include X-Elevated-Token when provided', async () => {
      localStorage.setItem('token', 'test-token');
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Success' }),
      });

      await adminAPI.changeUserRole('user-id', 'admin', 'elevated-token');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Elevated-Token': 'elevated-token',
          }),
        })
      );
    });
  });

  describe('verifyPassword', () => {
    it('should verify password successfully', async () => {
      const mockResponse = {
        elevatedToken: 'elevated-token',
        expiresAt: '2024-01-01T00:00:00Z',
        message: 'Elevated session granted',
      };

      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => mockResponse,
      };

      global.fetch.mockResolvedValueOnce(mockFetchResponse);

      const result = await adminAPI.verifyPassword('password123');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/verify-password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ password: 'password123' }),
        })
      );
    });

    it('should handle error response', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid password' }),
      };

      global.fetch.mockResolvedValueOnce(mockFetchResponse);

      await expect(adminAPI.verifyPassword('wrong')).rejects.toThrow('Invalid password');
    });
  });

  describe('listUsers', () => {
    it('should list users with default params', async () => {
      const mockResponse = {
        users: [{ id: '1', name: 'User 1' }],
        pagination: { page: 1, limit: 50, totalCount: 1 },
      };

      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => mockResponse,
      };

      global.fetch.mockResolvedValueOnce(mockFetchResponse);

      const result = await adminAPI.listUsers();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users'),
        expect.any(Object)
      );
    });

    it('should list users with query parameters', async () => {
      const mockResponse = {
        users: [],
        pagination: { page: 1, limit: 20, totalCount: 0 },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await adminAPI.listUsers({ page: 1, limit: 20, role: 'user', search: 'test' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/admin\/users\?.*role=user.*search=test/),
        expect.any(Object)
      );
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(adminAPI.listUsers()).rejects.toThrow('Network error');
    });

    it('should handle API errors', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      };

      global.fetch.mockResolvedValueOnce(mockFetchResponse);

      await expect(adminAPI.listUsers()).rejects.toThrow('Server error');
    });
  });

  describe('getUser', () => {
    it('should get user details', async () => {
      const mockResponse = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        stats: { jobDescriptionsCount: 5 },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await adminAPI.getUser('user-id');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/user-id'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle 404 error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'User not found' }),
      });

      await expect(adminAPI.getUser('invalid-id')).rejects.toThrow('User not found');
    });
  });

  describe('changeUserRole', () => {
    it('should change user role successfully', async () => {
      const mockResponse = {
        message: 'User role updated successfully',
        user: { id: 'user-id', role: 'admin' },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await adminAPI.changeUserRole('user-id', 'admin', 'elevated-token');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/user-id/role'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ role: 'admin' }),
          headers: expect.objectContaining({
            'X-Elevated-Token': 'elevated-token',
          }),
        })
      );
    });

    it('should handle error response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid role' }),
      });

      await expect(
        adminAPI.changeUserRole('user-id', 'invalid', 'elevated-token')
      ).rejects.toThrow('Invalid role');
    });
  });

  describe('resetUserPassword', () => {
    it('should reset password successfully', async () => {
      const mockResponse = {
        message: 'User password reset successfully',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await adminAPI.resetUserPassword('user-id', 'newPassword123', 'elevated-token');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/user-id/password'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ newPassword: 'newPassword123' }),
        })
      );
    });

    it('should handle validation error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Password must be at least 8 characters' }),
      });

      await expect(
        adminAPI.resetUserPassword('user-id', 'short', 'elevated-token')
      ).rejects.toThrow('Password must be at least 8 characters');
    });
  });

  describe('changeUserStatus', () => {
    it('should activate user successfully', async () => {
      const mockResponse = {
        message: 'User account activated successfully',
        user: { id: 'user-id', is_active: true },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await adminAPI.changeUserStatus('user-id', true, 'elevated-token');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/user-id/status'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ is_active: true }),
        })
      );
    });

    it('should deactivate user successfully', async () => {
      const mockResponse = {
        message: 'User account deactivated successfully',
        user: { id: 'user-id', is_active: false },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await adminAPI.changeUserStatus('user-id', false, 'elevated-token');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ is_active: false }),
        })
      );
    });
  });

  describe('getUserActivity', () => {
    it('should get user activity logs', async () => {
      const mockResponse = {
        activity: [
          { id: '1', action: 'login', created_at: '2024-01-01' },
        ],
        pagination: { limit: 50, offset: 0, totalCount: 1 },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await adminAPI.getUserActivity('user-id');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/user-id/activity'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should get user activity with pagination params', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ activity: [], pagination: {} }),
      });

      await adminAPI.getUserActivity('user-id', { limit: 10, offset: 20 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/admin\/users\/user-id\/activity\?.*limit=10.*offset=20/),
        expect.any(Object)
      );
    });
  });

  describe('handleResponse', () => {
    it('should handle invalid JSON response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(adminAPI.listUsers()).rejects.toThrow();
    });

    it('should handle response with message instead of error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Custom error message' }),
      });

      await expect(adminAPI.listUsers()).rejects.toThrow('Custom error message');
    });

    it('should handle response with status code only', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(adminAPI.listUsers()).rejects.toThrow('Request failed with status 500');
    });
  });
});
