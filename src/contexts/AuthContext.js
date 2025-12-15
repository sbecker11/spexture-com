import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [elevatedToken, setElevatedToken] = useState(null);
  const [elevatedExpiresAt, setElevatedExpiresAt] = useState(null);

  // Verify token validity on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          // Try to fetch current user with the stored token
          // This verifies the token is still valid
          console.log('Verifying token...');
          const response = await authAPI.getCurrentUser();
          console.log('Token verification successful:', response.user);
          setUser(response.user);
        } catch (error) {
          // Token is invalid or expired
          console.error('Token verification failed:', error);
          console.log('Logging out due to token verification failure');
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    toast.success(`Welcome back, ${userData.name}!`);
  };

  const register = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    toast.success(`Welcome, ${userData.name}! Your account has been created.`);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setElevatedToken(null);
    setElevatedExpiresAt(null);
    localStorage.removeItem('token');
    localStorage.removeItem('originalAdmin'); // Clear impersonation data
    toast.info('You have been logged out.');
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    toast.success('Profile updated successfully!');
  };

  // Role checking helpers
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  // Elevated session management (for admin sensitive operations)
  const requestElevatedSession = async (password) => {
    try {
      const apiUrl = process.env.SPEXTURE_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3011/api';
      const response = await fetch(`${apiUrl}/admin/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify password');
      }

      const data = await response.json();
      setElevatedToken(data.elevatedToken);
      setElevatedExpiresAt(data.expiresAt);

      toast.success('Elevated session granted (15 minutes)');
      return { success: true, token: data.elevatedToken };
    } catch (error) {
      toast.error(error.message || 'Failed to verify password');
      return { success: false, token: null };
    }
  };

  const clearElevatedSession = () => {
    setElevatedToken(null);
    setElevatedExpiresAt(null);
  };

  const hasElevatedSession = () => {
    if (!elevatedToken || !elevatedExpiresAt) return false;
    return new Date(elevatedExpiresAt) > new Date();
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    hasRole,
    login,
    register,
    logout,
    updateUser,
    // Elevated session for admin operations
    elevatedToken,
    elevatedExpiresAt,
    hasElevatedSession,
    requestElevatedSession,
    clearElevatedSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

