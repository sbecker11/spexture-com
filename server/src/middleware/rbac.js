/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Provides middleware functions for:
 * - Checking user roles
 * - Requiring admin privileges
 * - Requiring elevated admin sessions
 * - Logging admin actions
 */

const jwt = require('jsonwebtoken');
const pool = require('../database/connection');

/**
 * Middleware to require admin role
 * Must be used after auth middleware (which sets req.user)
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

/**
 * Middleware to require elevated admin session
 * Used for sensitive operations like changing user roles or passwords
 * Admin must re-authenticate to get elevated token
 */
const requireElevatedSession = (req, res, next) => {
  const elevatedToken = req.headers['x-elevated-token'];

  if (!elevatedToken) {
    return res.status(403).json({ 
      error: 'Elevated session required. Please re-authenticate.',
      code: 'ELEVATED_SESSION_REQUIRED',
      action: 'reauthenticate'
    });
  }

  try {
    // Verify elevated token
    const decoded = jwt.verify(elevatedToken, process.env.JWT_SECRET || process.env.SPEXTURE_JWT_SECRET);

    // Check if token has expired
    if (Date.now() > decoded.expiresAt) {
      return res.status(403).json({ 
        error: 'Elevated session expired. Please re-authenticate.',
        code: 'ELEVATED_SESSION_EXPIRED',
        action: 'reauthenticate'
      });
    }

    // Verify user is still admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    // Store elevated session info in request
    req.elevatedSession = {
      userId: decoded.userId,
      expiresAt: decoded.expiresAt
    };

    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Invalid elevated session token',
      code: 'INVALID_ELEVATED_TOKEN',
      action: 'reauthenticate'
    });
  }
};

/**
 * Middleware to check if user can access a specific user's data
 * Admins can access any user's data
 * Regular users can only access their own data
 */
const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Get target user ID from route params or body
  const targetUserId = req.params.userId || req.params.id || req.body.userId;

  if (!targetUserId) {
    return res.status(400).json({ 
      error: 'User ID required',
      code: 'USER_ID_REQUIRED'
    });
  }

  // Admin can access any user's data (including non-existent users for 404)
  if (req.user.role === 'admin') {
    return next();
  }

  // Regular user can only access their own data
  // Allow the route handler to check if user exists first (for 404)
  // If the user exists but is not the owner, return 403
  // If the user doesn't exist and it's not the owner, still return 403 (security)
  // The route handler will check existence and return 404 if needed
  if (req.user.id !== targetUserId) {
    return res.status(403).json({ 
      error: 'Access denied. You can only access your own data.',
      code: 'OWNERSHIP_REQUIRED'
    });
  }

  next();
};

/**
 * Log admin action to audit trail
 * @param {string} action - Action type (e.g., 'role_change', 'password_reset')
 * @param {string} targetUserId - ID of user being acted upon
 * @param {string} performedBy - ID of admin performing action
 * @param {object} metadata - Additional context
 * @param {object} req - Express request object (for IP and user agent)
 */
const logAdminAction = async (action, targetUserId, performedBy, metadata = {}, req = null) => {
  try {
    const ipAddress = req ? (req.ip || req.connection.remoteAddress) : null;
    const userAgent = req ? req.get('user-agent') : null;

    await pool.query(
      `INSERT INTO user_auth_logs 
       (user_id, action, ip_address, user_agent, success, performed_by, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [targetUserId, action, ipAddress, userAgent, true, performedBy, JSON.stringify(metadata)]
    );
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Don't throw - logging failure shouldn't break the operation
  }
};

/**
 * Log authentication event
 * @param {string} userId - User ID
 * @param {string} action - Action type (e.g., 'login', 'logout', 'failed_login')
 * @param {boolean} success - Whether action was successful
 * @param {string} failureReason - Reason for failure (if applicable)
 * @param {object} req - Express request object
 */
const logAuthEvent = async (userId, action, success = true, failureReason = null, req = null) => {
  try {
    const ipAddress = req ? (req.ip || req.connection.remoteAddress) : null;
    const userAgent = req ? req.get('user-agent') : null;

    await pool.query(
      `INSERT INTO user_auth_logs 
       (user_id, action, ip_address, user_agent, success, failure_reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, ipAddress, userAgent, success, failureReason]
    );
  } catch (error) {
    console.error('Error logging auth event:', error);
    // Don't throw - logging failure shouldn't break the operation
  }
};

/**
 * Generate elevated session token
 * Valid for 15 minutes
 * @param {string} userId - Admin user ID
 * @param {string} role - User role (should be 'admin')
 * @returns {object} - { token, expiresAt }
 */
const generateElevatedToken = (userId, role) => {
  const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes from now

  const token = jwt.sign(
    {
      userId,
      role,
      expiresAt,
      elevated: true
    },
    process.env.JWT_SECRET || process.env.SPEXTURE_JWT_SECRET,
    { expiresIn: '15m' }
  );

  return {
    token,
    expiresAt: new Date(expiresAt).toISOString()
  };
};

module.exports = {
  requireAdmin,
  requireElevatedSession,
  requireOwnershipOrAdmin,
  logAdminAction,
  logAuthEvent,
  generateElevatedToken
};

