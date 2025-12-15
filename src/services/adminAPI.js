/**
 * Admin API Service
 * Handles all admin-related API calls
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Get authorization headers
 * @param {string} elevatedToken - Optional elevated session token
 * @returns {object} Headers object
 */
const getHeaders = (elevatedToken = null) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (elevatedToken) {
    headers['X-Elevated-Token'] = elevatedToken;
  }

  return headers;
};

/**
 * Handle API response
 * @param {Response} response - Fetch response
 * @returns {Promise<object>} Parsed JSON response
 */
const handleResponse = async (response) => {
  let data;
  try {
    data = await response.json();
  } catch (error) {
    // If JSON parsing fails, throw a more descriptive error
    throw new Error(`Server returned invalid response (status: ${response.status})`);
  }

  if (!response.ok) {
    const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/**
 * Admin API
 */
export const adminAPI = {
  /**
   * Verify admin password and get elevated session token
   * @param {string} password - Admin password
   * @returns {Promise<object>} { elevatedToken, expiresAt }
   */
  verifyPassword: async (password) => {
    const response = await fetch(`${API_BASE_URL}/admin/verify-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ password }),
    });
    return handleResponse(response);
  },

  /**
   * List all users with filtering, sorting, and pagination
   * @param {object} params - Query parameters
   * @returns {Promise<object>} { users, pagination }
   */
  listUsers: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/admin/users?${queryString}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Cannot connect to server. Please check if the server is running.');
      }
      throw error;
    }
  },

  /**
   * Get detailed user information
   * @param {string} userId - User ID
   * @returns {Promise<object>} User object with stats and activity
   */
  getUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Change user role
   * @param {string} userId - User ID
   * @param {string} role - New role ('admin' or 'user')
   * @param {string} elevatedToken - Elevated session token
   * @returns {Promise<object>} Updated user object
   */
  changeUserRole: async (userId, role, elevatedToken) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: getHeaders(elevatedToken),
      body: JSON.stringify({ role }),
    });
    return handleResponse(response);
  },

  /**
   * Reset user password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @param {string} elevatedToken - Elevated session token
   * @returns {Promise<object>} Success message
   */
  resetUserPassword: async (userId, newPassword, elevatedToken) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/password`, {
      method: 'PUT',
      headers: getHeaders(elevatedToken),
      body: JSON.stringify({ newPassword }),
    });
    return handleResponse(response);
  },

  /**
   * Activate or deactivate user account
   * @param {string} userId - User ID
   * @param {boolean} isActive - Active status
   * @param {string} elevatedToken - Elevated session token
   * @returns {Promise<object>} Updated user object
   */
  changeUserStatus: async (userId, isActive, elevatedToken) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: getHeaders(elevatedToken),
      body: JSON.stringify({ is_active: isActive }),
    });
    return handleResponse(response);
  },

  /**
   * Get user activity logs
   * @param {string} userId - User ID
   * @param {object} params - Query parameters (limit, offset)
   * @returns {Promise<object>} { activity, pagination }
   */
  getUserActivity: async (userId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/activity?${queryString}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Impersonate (login as) another user
   * Requires elevated session token
   * @param {string} userId - User ID to impersonate
   * @param {string} elevatedToken - Elevated session token
   * @returns {Promise<object>} { user, token, message, originalAdmin }
   */
  impersonateUser: async (userId, elevatedToken) => {
    const response = await fetch(`${API_BASE_URL}/admin/impersonate/${userId}`, {
      method: 'POST',
      headers: getHeaders(elevatedToken),
    });
    return handleResponse(response);
  },
};

