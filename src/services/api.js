/**
 * API Service - HTTP client for REST API
 * Provides methods for making API requests with enhanced error handling
 */

const API_URL = process.env.SPEXTURE_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3011/api';

/**
 * Custom API Error class for better error handling
 */
class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Get authentication token from localStorage
 * Note: Changed from 'authToken' to 'token' to match AuthContext
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Get headers for API requests
 */
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * Extract error message from API response
 */
const extractErrorMessage = (error) => {
  // Handle different error response formats
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error) return error.error;
  if (error.errors && Array.isArray(error.errors)) {
    // Handle express-validator format (msg) and other formats (message)
    return error.errors.map(e => e.msg || e.message || e).join(', ');
  }
  return 'An unexpected error occurred';
};

/**
 * Handle API response with improved error extraction
 */
const handleResponse = async (response) => {
  // Handle successful responses
  if (response.ok) {
    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true };
    }
    return response.json();
  }

  // Handle error responses
  let errorData;
  try {
    errorData = await response.json();
  } catch (e) {
    errorData = { error: response.statusText || 'Request failed' };
  }

  const errorMessage = extractErrorMessage(errorData);
  throw new APIError(errorMessage, response.status, errorData);
};

/**
 * API request wrapper with retry logic and better error handling
 */
const request = async (endpoint, options = {}, retryCount = 0) => {
  const url = `${API_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(options.includeAuth !== false),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new APIError(
        'Network error: Unable to connect to server. Please check your connection.',
        0,
        { originalError: error.message }
      );
    }

    // Handle timeout errors
    if (error.name === 'AbortError') {
      throw new APIError('Request timeout', 408, { originalError: error.message });
    }

    // Retry logic for specific status codes (optional)
    const shouldRetry = error.status >= 500 && retryCount < 2;
    if (shouldRetry) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return request(endpoint, options, retryCount + 1);
    }

    // Re-throw APIError or wrap other errors
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError(
      error.message || 'An unexpected error occurred',
      error.status || 500,
      { originalError: error.message }
    );
  }
};

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User's full name
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - User's password
   * @returns {Promise<{user: Object, token: string}>}
   */
  register: async (userData) => {
    return request('/auth/register', {
      method: 'POST',
      includeAuth: false,
      body: JSON.stringify(userData),
    });
  },

  /**
   * Login user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<{user: Object, token: string}>}
   */
  login: async (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      includeAuth: false,
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Get current authenticated user
   * @returns {Promise<{user: Object}>}
   */
  getCurrentUser: async () => {
    return request('/users/me');
  },
};

/**
 * Users API
 */
export const usersAPI = {
  /**
   * Get all users
   */
  getAll: async () => {
    return request('/users');
  },

  /**
   * Get current authenticated user
   */
  getCurrent: async () => {
    return request('/users/me');
  },

  /**
   * Get user by ID
   */
  getById: async (id) => {
    return request(`/users/${id}`);
  },

  /**
   * Update user
   */
  update: async (id, userData) => {
    return request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Delete user
   */
  delete: async (id) => {
    return request(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Health check API
 */
export const healthAPI = {
  /**
   * Check server health
   */
  check: async () => {
    const url = API_URL.replace('/api', '/health');
    const response = await fetch(url);
    return response.json();
  },
};

/**
 * Job Descriptions API
 */
export const jobDescriptionsAPI = {
  /**
   * Get all job descriptions for current user
   * @returns {Promise<{jobDescriptions: Array}>}
   */
  getAll: async () => {
    return request('/job-descriptions');
  },

  /**
   * Get job description by ID
   * @param {string} id - Job description ID
   * @returns {Promise<{jobDescription: Object}>}
   */
  getById: async (id) => {
    return request(`/job-descriptions/${id}`);
  },

  /**
   * Create new job description
   * @param {Object} jobData - Job description data
   * @returns {Promise<{jobDescription: Object}>}
   */
  create: async (jobData) => {
    return request('/job-descriptions', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  /**
   * Update job description
   * @param {string} id - Job description ID
   * @param {Object} jobData - Updated job description data
   * @returns {Promise<{jobDescription: Object}>}
   */
  update: async (id, jobData) => {
    return request(`/job-descriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  },

  /**
   * Delete job description
   * @param {string} id - Job description ID
   * @returns {Promise<{success: boolean}>}
   */
  delete: async (id) => {
    return request(`/job-descriptions/${id}`, {
      method: 'DELETE',
    });
  },
};

const api = {
  authAPI,
  usersAPI,
  healthAPI,
  jobDescriptionsAPI,
  APIError,
};

export default api;

