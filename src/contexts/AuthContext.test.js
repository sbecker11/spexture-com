import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

// Mock dependencies
jest.mock('../services/api', () => ({
  authAPI: {
    getCurrentUser: jest.fn(),
  },
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

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

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('AuthProvider initialization', () => {
    it('should initialize with null user when no token', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Initial state
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should verify token on mount when token exists', async () => {
      const mockToken = 'valid-token-123';
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      };

      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(authAPI.getCurrentUser).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle invalid token on mount', async () => {
      const mockToken = 'invalid-token';
      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockRejectedValue(new Error('Invalid token'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });

    it('should handle network errors during token verification', async () => {
      const mockToken = 'some-token';
      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login function', () => {
    it('should set user and token on successful login', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      };
      const mockToken = 'auth-token-123';

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(toast.success).toHaveBeenCalledWith('Welcome back, John Doe!');
    });

    it('should handle login with minimal user data', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const mockUser = { id: '1', name: 'User', email: 'user@test.com' };
      const mockToken = 'token';

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('register function', () => {
    it('should set user and token on successful registration', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const mockUser = {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
      };
      const mockToken = 'new-token-456';

      act(() => {
        result.current.register(mockUser, mockToken);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(toast.success).toHaveBeenCalledWith(
        'Welcome, Jane Smith! Your account has been created.'
      );
    });

    it('should handle registration with different user names', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const mockUser = { id: '3', name: 'Test User', email: 'test@test.com' };
      const mockToken = 'token-789';

      act(() => {
        result.current.register(mockUser, mockToken);
      });

      expect(toast.success).toHaveBeenCalledWith(
        'Welcome, Test User! Your account has been created.'
      );
    });
  });

  describe('logout function', () => {
    it('should clear user and token on logout', async () => {
      const mockToken = 'existing-token';
      const mockUser = { id: '1', name: 'John', email: 'john@test.com' };
      
      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(toast.info).toHaveBeenCalledWith('You have been logged out.');
    });

    it('should handle logout when already logged out', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(toast.info).toHaveBeenCalled();
    });
  });

  describe('updateUser function', () => {
    it('should update user data', async () => {
      const mockToken = 'token';
      const mockUser = { id: '1', name: 'John', email: 'john@test.com' };
      
      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      const updatedUser = { ...mockUser, name: 'John Updated' };

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user).toEqual(updatedUser);
      expect(toast.success).toHaveBeenCalledWith('Profile updated successfully!');
    });

    it('should handle partial user updates', async () => {
      const mockToken = 'token';
      const mockUser = { id: '1', name: 'John', email: 'john@test.com' };
      
      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      const updatedUser = { ...mockUser, email: 'newemail@test.com' };

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user.email).toBe('newemail@test.com');
      expect(result.current.user.name).toBe('John');
    });
  });

  describe('isAuthenticated property', () => {
    it('should be false when user is null', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should be true when user exists', async () => {
      const mockToken = 'token';
      const mockUser = { id: '1', name: 'John', email: 'john@test.com' };
      
      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('isAdmin and hasRole functions', () => {
    it('should return true for admin user', async () => {
      const mockToken = 'token';
      const mockUser = { id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin' };

      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin()).toBe(true);
      expect(result.current.hasRole('admin')).toBe(true);
    });

    it('should return false for non-admin user', async () => {
      const mockToken = 'token';
      const mockUser = { id: '1', name: 'User', email: 'user@test.com', role: 'user' };

      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.hasRole('user')).toBe(true);
      expect(result.current.hasRole('admin')).toBe(false);
    });

    it('should return false when user has no role', async () => {
      const mockToken = 'token';
      const mockUser = { id: '1', name: 'User', email: 'user@test.com' };

      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.hasRole('admin')).toBe(false);
    });

    it('should handle null user safely', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.hasRole('admin')).toBe(false);
    });
  });

  describe('elevated session management', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      delete global.fetch;
    });

    it('should request elevated session successfully', async () => {
      const mockToken = 'token';
      const mockUser = { id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin' };
      const elevatedToken = 'elevated-token-123';
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockResolvedValue({ user: mockUser });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevatedToken, expiresAt }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let result_obj;
      await act(async () => {
        result_obj = await result.current.requestElevatedSession('correct-password');
      });

      expect(result_obj.success).toBe(true);
      expect(result.current.elevatedToken).toBe(elevatedToken);
      expect(result.current.elevatedExpiresAt).toBe(expiresAt);
      expect(result.current.hasElevatedSession()).toBe(true);
      expect(toast.success).toHaveBeenCalledWith('Elevated session granted (15 minutes)');
    });

    it('should handle failed elevated session request', async () => {
      const mockToken = 'token';
      const mockUser = { id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin' };

      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockResolvedValue({ user: mockUser });

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid password' }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let result_obj;
      await act(async () => {
        result_obj = await result.current.requestElevatedSession('wrong-password');
      });

      expect(result_obj.success).toBe(false);
      expect(result.current.elevatedToken).toBeNull();
      expect(result.current.hasElevatedSession()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Invalid password');
    });

    it('should handle network error in elevated session request', async () => {
      const mockToken = 'token';
      const mockUser = { id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin' };

      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockResolvedValue({ user: mockUser });

      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let result_obj;
      await act(async () => {
        result_obj = await result.current.requestElevatedSession('password');
      });

      expect(result_obj.success).toBe(false);
      expect(toast.error).toHaveBeenCalled();
    });

    it('should clear elevated session', async () => {
      const mockToken = 'token';
      const mockUser = { id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin' };
      const elevatedToken = 'elevated-token-123';
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockResolvedValue({ user: mockUser });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevatedToken, expiresAt }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.requestElevatedSession('password');
      });

      expect(result.current.hasElevatedSession()).toBe(true);

      act(() => {
        result.current.clearElevatedSession();
      });

      expect(result.current.elevatedToken).toBeNull();
      expect(result.current.elevatedExpiresAt).toBeNull();
      expect(result.current.hasElevatedSession()).toBe(false);
    });

    it('should detect expired elevated session', async () => {
      const mockToken = 'token';
      const mockUser = { id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin' };
      const elevatedToken = 'elevated-token-123';
      const expiresAt = new Date(Date.now() - 1000).toISOString(); // Expired 1 second ago

      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockResolvedValue({ user: mockUser });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevatedToken, expiresAt }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.requestElevatedSession('password');
      });

      expect(result.current.hasElevatedSession()).toBe(false);
    });

    it('should return false for hasElevatedSession when no token', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasElevatedSession()).toBe(false);
    });

    it('should clear elevated session on logout', async () => {
      const mockToken = 'token';
      const mockUser = { id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin' };
      const elevatedToken = 'elevated-token-123';
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockResolvedValue({ user: mockUser });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevatedToken, expiresAt }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.requestElevatedSession('password');
      });

      expect(result.current.hasElevatedSession()).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.elevatedToken).toBeNull();
      expect(result.current.elevatedExpiresAt).toBeNull();
      expect(result.current.hasElevatedSession()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle expired token gracefully', async () => {
      const mockToken = 'expired-token';
      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockRejectedValue(new Error('Token expired'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });

    it('should handle malformed token', async () => {
      const mockToken = 'malformed.token.here';
      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockRejectedValue(new Error('Invalid token format'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });

    it('should handle server errors during verification', async () => {
      const mockToken = 'token';
      localStorageMock.getItem.mockReturnValue(mockToken);
      authAPI.getCurrentUser.mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });
  });
});

