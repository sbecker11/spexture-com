/**
 * Admin Routes
 * 
 * Endpoints for admin user management and elevated authentication
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../database/connection');
const { 
  requireAdmin, 
  requireElevatedSession,
  logAdminAction,
  generateElevatedToken
} = require('../middleware/rbac');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/admin/verify-password
 * Verify admin password and issue elevated session token
 * Required for sensitive operations
 */
router.post('/verify-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        error: 'Password required',
        code: 'PASSWORD_REQUIRED'
      });
    }

    // Get admin's current password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid password',
        code: 'INVALID_PASSWORD'
      });
    }

    // Generate elevated session token (15 minutes)
    const { token, expiresAt } = generateElevatedToken(req.user.id, req.user.role);

    res.json({
      elevatedToken: token,
      expiresAt,
      message: 'Elevated session granted'
    });
  } catch (error) {
    console.error('Error verifying admin password:', error);
    res.status(500).json({ 
      error: 'Failed to verify password',
      code: 'VERIFICATION_ERROR'
    });
  }
});

/**
 * POST /api/admin/impersonate/:userId
 * Allow admin to impersonate (login as) another user
 * Requires elevated session for security
 */
router.post('/impersonate/:userId', authenticateToken, requireAdmin, requireElevatedSession, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    // Prevent admin from impersonating themselves
    if (userId === adminId) {
      return res.status(400).json({
        error: 'Cannot impersonate yourself',
        code: 'SELF_IMPERSONATION'
      });
    }

    // Get target user
    const userResult = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const targetUser = userResult.rows[0];

    // Check if target user is active
    if (!targetUser.is_active) {
      return res.status(400).json({
        error: 'Cannot impersonate inactive user',
        code: 'USER_INACTIVE'
      });
    }

    // Generate a regular token for the target user
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      {
        userId: targetUser.id,
        email: targetUser.email,
        role: targetUser.role
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Log the impersonation action
    await logAdminAction(
      req.user.id,
      'impersonate_user',
      userId,
      {
        target_user_email: targetUser.email,
        target_user_role: targetUser.role,
        admin_email: req.user.email
      }
    );

    res.json({
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        is_active: targetUser.is_active
      },
      token,
      message: `Now logged in as ${targetUser.name}`,
      originalAdmin: {
        id: adminId,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Error impersonating user:', error);
    res.status(500).json({
      error: 'Failed to impersonate user',
      code: 'IMPERSONATION_ERROR'
    });
  }
});

/**
 * GET /api/admin/users
 * List all users with filtering, sorting, and pagination
 * Admin only - Returns ALL users including other admins (no role filtering by default)
 */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      role,
      is_active,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = 1,
      limit = 50
    } = req.query;

    // Build WHERE clause
    // Note: By default, returns ALL users (including admins) unless role filter is specified
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (role) {
      conditions.push(`role = $${paramIndex++}`);
      params.push(role);
    }

    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramIndex++}`);
      params.push(is_active === 'true');
    }

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Validate sort column
    const validSortColumns = ['name', 'email', 'role', 'is_active', 'last_login_at', 'created_at'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Validate and parse pagination parameters
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const validPage = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const validLimit = !isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 50;

    // Calculate pagination
    const offset = (validPage - 1) * validLimit;

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countParams = params;
    console.log('📊 [Admin Users] Count Query:', countQuery);
    console.log('📊 [Admin Users] Count Params:', countParams);
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    console.log('📊 [Admin Users] Total Count Result:', totalCount);

    // Get users
    const usersQuery = `SELECT
      id, name, email, role, is_active, last_login_at, created_at, updated_at,
      created_by, updated_by
     FROM users
     ${whereClause}
     ORDER BY ${sortColumn} ${sortDirection}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const usersParams = [...params, validLimit, offset];
    console.log('📊 [Admin Users] Users Query:', usersQuery);
    console.log('📊 [Admin Users] Users Params:', usersParams);
    const usersResult = await pool.query(usersQuery, usersParams);
    console.log('📊 [Admin Users] Users Result Count:', usersResult.rows.length);
    console.log('📊 [Admin Users] Users Result:', JSON.stringify(usersResult.rows, null, 2));

    // Get user stats (JD count, resume count, etc.)
    // Note: Returns stats for ALL users including admins
    const userIds = usersResult.rows.map(u => u.id);
    let statsResult = { rows: [] };
    
    // Only query stats if there are users
    // Wrap in try-catch to handle missing tables gracefully
    if (userIds.length > 0) {
      try {
        // Only query job_descriptions since resumes and cover_letters tables may not exist yet
        const statsQuery = `SELECT 
          u.id as user_id,
          COUNT(DISTINCT jd.id) as job_descriptions_count
         FROM users u
         LEFT JOIN job_descriptions jd ON u.id = jd.user_id
         WHERE u.id = ANY($1)
         GROUP BY u.id`;
        const statsParams = [userIds];
        console.log('📊 [Admin Users] Stats Query:', statsQuery);
        console.log('📊 [Admin Users] Stats Params (userIds):', userIds);
        statsResult = await pool.query(statsQuery, statsParams);
        console.log('📊 [Admin Users] Stats Result:', JSON.stringify(statsResult.rows, null, 2));
      } catch (statsError) {
        console.warn('⚠️ [Admin Users] Stats query failed (tables may not exist):', statsError.message);
        // Continue with empty stats - don't fail the entire request
        statsResult = { rows: [] };
      }
    }

    // Merge stats with users
    const statsMap = {};
    statsResult.rows.forEach(stat => {
      statsMap[stat.user_id] = {
        jobDescriptionsCount: parseInt(stat.job_descriptions_count || 0),
        resumesCount: 0, // Table doesn't exist yet
        coverLettersCount: 0 // Table doesn't exist yet
      };
    });

    const users = usersResult.rows.map(user => ({
      ...user,
      stats: statsMap[user.id] || {
        jobDescriptionsCount: 0,
        resumesCount: 0,
        coverLettersCount: 0
      }
    }));

    const response = {
      users,
      pagination: {
        page: validPage,
        limit: validLimit,
        totalCount,
        totalPages: Math.ceil(totalCount / validLimit)
      }
    };

    console.log('📊 [Admin Users] Final Response:', JSON.stringify({
      userCount: users.length,
      users: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
      pagination: response.pagination
    }, null, 2));

    res.json(response);
  } catch (error) {
    console.error('Error listing users:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to list users',
      message: error.message,
      code: 'LIST_USERS_ERROR'
    });
  }
});

/**
 * GET /api/admin/users/:id
 * Get detailed user information
 * Admin only
 */
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        id, name, email, role, is_active, last_login_at, created_at, updated_at,
        created_by, updated_by
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    // Get user stats (only query tables that exist)
    let statsResult;
    try {
      statsResult = await pool.query(
        `SELECT 
          COUNT(DISTINCT jd.id) as job_descriptions_count
         FROM users u
         LEFT JOIN job_descriptions jd ON u.id = jd.user_id
         WHERE u.id = $1`,
        [id]
      );
    } catch (statsError) {
      console.warn('⚠️ [Admin Users] Stats query failed (tables may not exist):', statsError.message);
      statsResult = { rows: [{ job_descriptions_count: 0 }] };
    }

    user.stats = {
      jobDescriptionsCount: parseInt(statsResult.rows[0]?.job_descriptions_count || 0),
      resumesCount: 0, // Table doesn't exist yet
      coverLettersCount: 0, // Table doesn't exist yet
      companiesCount: 0, // Table doesn't exist yet
      recruitersCount: 0 // Table doesn't exist yet
    };

    // Get recent activity
    const activityResult = await pool.query(
      `SELECT action, ip_address, success, created_at, performed_by
       FROM user_auth_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    user.recentActivity = activityResult.rows;

    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ 
      error: 'Failed to get user',
      code: 'GET_USER_ERROR'
    });
  }
});

/**
 * PUT /api/admin/users/:id/role
 * Change user role
 * Requires elevated session
 */
router.put('/users/:id/role', authenticateToken, requireAdmin, requireElevatedSession, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be "admin" or "user"',
        code: 'INVALID_ROLE'
      });
    }

    // Prevent admin from changing their own role
    if (id === req.user.id) {
      return res.status(400).json({ 
        error: 'Cannot change your own role',
        code: 'CANNOT_CHANGE_OWN_ROLE'
      });
    }

    // Get current user data
    const currentResult = await pool.query(
      'SELECT name, email, role FROM users WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const currentUser = currentResult.rows[0];
    const oldRole = currentUser.role;

    // Update role
    const result = await pool.query(
      `UPDATE users 
       SET role = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, name, email, role, is_active, updated_at`,
      [role, req.user.id, id]
    );

    const updatedUser = result.rows[0];

    // Log admin action
    await logAdminAction(
      'role_change',
      id,
      req.user.id,
      { old_role: oldRole, new_role: role, user_email: currentUser.email },
      req
    );

    res.json({
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ 
      error: 'Failed to update user role',
      code: 'UPDATE_ROLE_ERROR'
    });
  }
});

/**
 * PUT /api/admin/users/:id/password
 * Reset user password
 * Requires elevated session
 */
router.put('/users/:id/password', authenticateToken, requireAdmin, requireElevatedSession, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters',
        code: 'INVALID_PASSWORD'
      });
    }

    // Get user email for logging
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const userEmail = userResult.rows[0].email;

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [passwordHash, req.user.id, id]
    );

    // Log admin action
    await logAdminAction(
      'password_reset',
      id,
      req.user.id,
      { user_email: userEmail, reset_by_admin: true },
      req
    );

    res.json({
      message: 'User password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(500).json({ 
      error: 'Failed to reset user password',
      code: 'RESET_PASSWORD_ERROR'
    });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Activate or deactivate user account
 * Requires elevated session
 */
router.put('/users/:id/status', authenticateToken, requireAdmin, requireElevatedSession, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ 
        error: 'is_active must be a boolean',
        code: 'INVALID_STATUS'
      });
    }

    // Prevent admin from deactivating themselves
    if (id === req.user.id) {
      return res.status(400).json({ 
        error: 'Cannot change your own account status',
        code: 'CANNOT_CHANGE_OWN_STATUS'
      });
    }

    // Get user email for logging
    const userResult = await pool.query(
      'SELECT email, is_active FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];
    const oldStatus = user.is_active;

    // Update status
    const result = await pool.query(
      `UPDATE users 
       SET is_active = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, name, email, role, is_active, updated_at`,
      [is_active, req.user.id, id]
    );

    const updatedUser = result.rows[0];

    // Log admin action
    await logAdminAction(
      is_active ? 'account_activated' : 'account_deactivated',
      id,
      req.user.id,
      { user_email: user.email, old_status: oldStatus, new_status: is_active },
      req
    );

    res.json({
      message: `User account ${is_active ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ 
      error: 'Failed to update user status',
      code: 'UPDATE_STATUS_ERROR'
    });
  }
});

/**
 * GET /api/admin/users/:id/activity
 * Get user activity logs
 * Admin only
 */
router.get('/users/:id/activity', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT 
        ual.id, ual.action, ual.ip_address, ual.user_agent, 
        ual.success, ual.failure_reason, ual.metadata, ual.created_at,
        u.name as performed_by_name, u.email as performed_by_email
       FROM user_auth_logs ual
       LEFT JOIN users u ON ual.performed_by = u.id
       WHERE ual.user_id = $1
       ORDER BY ual.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, parseInt(limit), parseInt(offset)]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM user_auth_logs WHERE user_id = $1',
      [id]
    );

    res.json({
      activity: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        totalCount: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(500).json({ 
      error: 'Failed to get user activity',
      code: 'GET_ACTIVITY_ERROR'
    });
  }
});

module.exports = router;

