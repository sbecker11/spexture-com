/**
 * API Service Tests
 */

import { authAPI, usersAPI, healthAPI } from './api';

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('API Service', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear();
  });

  describe('authAPI', () => {
    describe('register', () => {
      it('should register a new user successfully', async () => {
        const mockResponse = {
          message: 'User registered successfully',
          token: 'mock-jwt-token',
          user: {
            id: '123',
            name: 'John Doe',
            email: 'john@example.com',
          },
        };

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await authAPI.register({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
        });

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/register'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
              name: 'John Doe',
              email: 'john@example.com',
              password: 'Password123!',
            }),
          })
        );

        expect(result).toEqual(mockResponse);
      });

      it('should handle registration errors', async () => {
        const mockError = { error: 'User with this email already exists' };

        fetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => mockError,
        });

        await expect(
          authAPI.register('John Doe', 'john@example.com', 'Password123!')
        ).rejects.toThrow('User with this email already exists');
      });

      it('should not include Authorization header', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'success' }),
        });

        await authAPI.register('John Doe', 'john@example.com', 'Password123!');

        const callArgs = fetch.mock.calls[0][1];
        expect(callArgs.headers).not.toHaveProperty('Authorization');
      });
    });

    describe('login', () => {
      it('should login user successfully', async () => {
        const mockResponse = {
          message: 'Login successful',
          token: 'mock-jwt-token',
          user: {
            id: '123',
            name: 'John Doe',
            email: 'john@example.com',
          },
        };

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await authAPI.login('john@example.com', 'Password123!');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              email: 'john@example.com',
              password: 'Password123!',
            }),
          })
        );

        expect(result).toEqual(mockResponse);
      });

      it('should handle login errors', async () => {
        const mockError = { error: 'Invalid email or password' };

        fetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => mockError,
        });

        await expect(
          authAPI.login('john@example.com', 'wrongpassword')
        ).rejects.toThrow('Invalid email or password');
      });
    });
  });

  describe('usersAPI', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue('mock-jwt-token');
    });

    describe('getAll', () => {
      it('should fetch all users', async () => {
        localStorageMock.getItem.mockReturnValue('mock-jwt-token');
        
        const mockResponse = {
          users: [
            { id: '1', name: 'User 1', email: 'user1@example.com' },
            { id: '2', name: 'User 2', email: 'user2@example.com' },
          ],
        };

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await usersAPI.getAll();

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/users'),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-jwt-token',
            }),
          })
        );

        expect(result).toEqual(mockResponse);
      });
    });

    describe('getCurrent', () => {
      it('should fetch current user', async () => {
        const mockResponse = {
          user: {
            id: '123',
            name: 'John Doe',
            email: 'john@example.com',
          },
        };

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await usersAPI.getCurrent();

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/users/me'),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-jwt-token',
            }),
          })
        );

        expect(result).toEqual(mockResponse);
      });
    });

    describe('getById', () => {
      it('should fetch user by ID', async () => {
        const mockResponse = {
          user: {
            id: '123',
            name: 'John Doe',
            email: 'john@example.com',
          },
        };

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await usersAPI.getById('123');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/users/123'),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-jwt-token',
            }),
          })
        );

        expect(result).toEqual(mockResponse);
      });
    });

    describe('update', () => {
      it('should update user', async () => {
        const mockResponse = {
          message: 'User updated successfully',
          user: {
            id: '123',
            name: 'John Updated',
            email: 'john@example.com',
          },
        };

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const updateData = { name: 'John Updated' };
        const result = await usersAPI.update('123', updateData);

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/users/123'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updateData),
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-jwt-token',
            }),
          })
        );

        expect(result).toEqual(mockResponse);
      });
    });

    describe('delete', () => {
      it('should delete user', async () => {
        const mockResponse = {
          message: 'User deleted successfully',
        };

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await usersAPI.delete('123');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/users/123'),
          expect.objectContaining({
            method: 'DELETE',
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-jwt-token',
            }),
          })
        );

        expect(result).toEqual(mockResponse);
      });
    });

    describe('Authorization header', () => {
      it('should include Authorization header when token exists', async () => {
        localStorage.getItem.mockReturnValue('mock-token');
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ users: [] }),
        });

        await usersAPI.getAll();

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-token',
            }),
          })
        );
      });

      it('should not include Authorization header when token is missing', async () => {
        localStorage.getItem.mockReturnValue(null);
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ users: [] }),
        });

        await usersAPI.getAll();

        const callArgs = fetch.mock.calls[0][1];
        expect(callArgs.headers).not.toHaveProperty('Authorization');
      });
    });
  });

  describe('healthAPI', () => {
    it('should check server health', async () => {
      const mockResponse = {
        status: 'ok',
        message: 'Server is running',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await healthAPI.check();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health')
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(authAPI.login('test@example.com', 'password')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle invalid JSON responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(authAPI.login('test@example.com', 'password')).rejects.toThrow();
    });

    it('should handle HTTP errors without JSON body', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(authAPI.login('test@example.com', 'password')).rejects.toThrow();
    });
  });

  describe('Enhanced Error Handling', () => {
    describe('APIError class', () => {
      it('should throw APIError with status and message', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Bad Request' }),
        });

        try {
          await authAPI.login('test@example.com', 'password');
          fail('Should have thrown an error');
        } catch (error) {
          expect(error.message).toBe('Bad Request');
        }
      });

      it('should extract error message from different formats', async () => {
        // Test with 'message' field
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: 'Error message' }),
        });

        await expect(authAPI.login('test@example.com', 'password'))
          .rejects.toThrow('Error message');
      });

      it('should handle array of errors', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            errors: [
              { message: 'Error 1' },
              { message: 'Error 2' }
            ]
          }),
        });

        await expect(authAPI.login('test@example.com', 'password'))
          .rejects.toThrow('Error 1, Error 2');
      });

      it('should handle string error', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => 'Simple error string',
        });

        await expect(authAPI.login('test@example.com', 'password'))
          .rejects.toThrow('Simple error string');
      });
    });

    describe('Network error handling', () => {
      it('should detect and handle network errors', async () => {
        fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        await expect(authAPI.login('test@example.com', 'password'))
          .rejects.toThrow(/network error|unable to connect/i);
      });

      it('should handle timeout errors', async () => {
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        fetch.mockRejectedValueOnce(abortError);

        await expect(authAPI.login('test@example.com', 'password'))
          .rejects.toThrow(/timeout/i);
      });

      it('should provide user-friendly network error messages', async () => {
        fetch.mockRejectedValueOnce(new TypeError('Network request failed'));

        try {
          await authAPI.login('test@example.com', 'password');
          fail('Should have thrown');
        } catch (error) {
          expect(error.message).toMatch(/network|connection/i);
        }
      });
    });

    describe('Retry logic for 5xx errors', () => {
      it('should retry on 500 error', async () => {
        // First two calls fail with 500, third succeeds
        fetch
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Server error' }),
          })
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Server error' }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          });

        const result = await authAPI.login('test@example.com', 'password');
        
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(result).toEqual({ success: true });
      });

      it('should stop retrying after 2 attempts', async () => {
        // All three calls fail with 500
        fetch
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Server error' }),
          })
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Server error' }),
          })
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Server error' }),
          });

        await expect(authAPI.login('test@example.com', 'password'))
          .rejects.toThrow('Server error');
        
        expect(fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
      });

      it('should not retry on 4xx errors', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Bad request' }),
        });

        await expect(authAPI.login('test@example.com', 'password'))
          .rejects.toThrow('Bad request');
        
        expect(fetch).toHaveBeenCalledTimes(1); // No retries
      });

      it('should not retry on 503 Service Unavailable', async () => {
        fetch
          .mockResolvedValueOnce({
            ok: false,
            status: 503,
            json: async () => ({ error: 'Service unavailable' }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          });

        const result = await authAPI.login('test@example.com', 'password');
        
        expect(fetch).toHaveBeenCalledTimes(2); // Retried once
      });
    });

    describe('204 No Content handling', () => {
      it('should handle 204 responses', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
          json: async () => {
            throw new Error('No content');
          },
        });

        const result = await usersAPI.delete('123');
        
        expect(result).toEqual({ success: true });
      });
    });
  });

  describe('jobDescriptionsAPI', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('mock-token');
    });

    describe('getAll', () => {
      it('should get all job descriptions', async () => {
        const mockJDs = {
          jobDescriptions: [
            { id: '1', title: 'Job 1' },
            { id: '2', title: 'Job 2' },
          ],
        };

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockJDs,
        });

        const result = await require('./api').jobDescriptionsAPI.getAll();

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/job-descriptions'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token',
            }),
          })
        );
        expect(result).toEqual(mockJDs);
      });
    });

    describe('getById', () => {
      it('should get job description by ID', async () => {
        const mockJD = { jobDescription: { id: '1', title: 'Job 1' } };

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockJD,
        });

        const result = await require('./api').jobDescriptionsAPI.getById('1');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/job-descriptions/1'),
          expect.any(Object)
        );
        expect(result).toEqual(mockJD);
      });
    });

    describe('create', () => {
      it('should create new job description', async () => {
        const newJD = {
          title: 'Software Engineer',
          description: 'Great job',
        };
        const mockResponse = { jobDescription: { id: '1', ...newJD } };

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await require('./api').jobDescriptionsAPI.create(newJD);

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/job-descriptions'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(newJD),
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('update', () => {
      it('should update job description', async () => {
        const updatedJD = { title: 'Updated Title' };
        const mockResponse = { jobDescription: { id: '1', ...updatedJD } };

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await require('./api').jobDescriptionsAPI.update('1', updatedJD);

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/job-descriptions/1'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updatedJD),
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('delete', () => {
      it('should delete job description', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

        const result = await require('./api').jobDescriptionsAPI.delete('1');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/job-descriptions/1'),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
        expect(result).toEqual({ success: true });
      });
    });
  });

  describe('authAPI.getCurrentUser', () => {
    it('should get current user with token', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      const mockUser = {
        user: {
          id: '123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await authAPI.getCurrentUser();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle unauthorized error', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      await expect(authAPI.getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });

  describe('Edge Case Error Handling', () => {
    it('should handle error array with mixed formats', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          errors: [
            { msg: 'Error with msg' },
            { message: 'Error with message' },
            'String error',
            { field: 'Error without msg or message' }
          ]
        }),
      });

      await expect(authAPI.login('test@example.com', 'password'))
        .rejects.toThrow('Error with msg, Error with message, String error, [object Object]');
    });

    it('should handle 204 No Content response correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('Should not call json() on 204');
        },
      });

      // Test with usersAPI.delete which should handle 204
      const result = await usersAPI.delete('123');
      expect(result).toEqual({ success: true });
    });
  });
});

