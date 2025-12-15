const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { logAuthEvent } = require('../middleware/rbac');
const { getRegisterValidators } = require('../validation/validationHelpers');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 * Uses shared validation config via validationHelpers
 */
router.post('/register', getRegisterValidators(), async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user (role defaults to 'user' in database)
    const result = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, passwordHash]
    );
    
    const user = result.rows[0];
    
    // Log registration event
    await logAuthEvent(user.id, 'register', true, null, req);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || process.env.SPEXTURE_JWT_SECRET,
      { expiresIn: (process.env.JWT_EXPIRES_IN || process.env.SPEXTURE_JWT_EXPIRES_IN || '24h') }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;
    
    // Get user from database
    const result = await query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      // Log failed login attempt (no user found)
      await logAuthEvent(null, 'failed_login', false, 'User not found', req);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // Check if account is active
    if (!user.is_active) {
      await logAuthEvent(user.id, 'failed_login', false, 'Account deactivated', req);
      return res.status(401).json({ error: 'Account has been deactivated. Please contact support.' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      await logAuthEvent(user.id, 'failed_login', false, 'Invalid password', req);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update last login timestamp
    await query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // Log successful login
    await logAuthEvent(user.id, 'login', true, null, req);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || process.env.SPEXTURE_JWT_SECRET,
      { expiresIn: (process.env.JWT_EXPIRES_IN || process.env.SPEXTURE_JWT_EXPIRES_IN || '24h') }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;

