/**
 * RBAC Middleware Tests
 * Tests for role-based access control middleware functions
 */

const jwt = require('jsonwebtoken');
const {
  requireAdmin,
  requireElevatedSession,
  requireOwnershipOrAdmin,
  logAdminAction,
  logAuthEvent,
  generateElevatedToken
} = require('../middleware/rbac');
const pool = require('../database/connection');

// Mock database connection
jest.mock('../database/connection', () => ({
  pool: {
    query: jest.fn()
  }
}));

describe('RBAC Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('requireAdmin', () => {
    it('should allow admin users', () => {
      const req = {
        user: { id: '1', role: 'admin' }
      };
      const res = {};
      const next = jest.fn();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject non-admin users', () => {
      const req = {
        user: { id: '1', role: 'user' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated users', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireElevatedSession', () => {
    it('should allow valid elevated token', () => {
      const expiresAt = Date.now() + (15 * 60 * 1000);
      const token = jwt.sign(
        { userId: '1', role: 'admin', expiresAt, elevated: true },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const req = {
        headers: { 'x-elevated-token': token },
        user: { id: '1', role: 'admin' }
      };
      const res = {};
      const next = jest.fn();

      requireElevatedSession(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.elevatedSession).toBeDefined();
      expect(req.elevatedSession.userId).toBe('1');
    });

    it('should reject missing elevated token', () => {
      const req = {
        headers: {},
        user: { id: '1', role: 'admin' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      requireElevatedSession(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Elevated session required. Please re-authenticate.',
        code: 'ELEVATED_SESSION_REQUIRED',
        action: 'reauthenticate'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired elevated token', () => {
      const expiresAt = Date.now() - 1000; // Expired
      const token = jwt.sign(
        { userId: '1', role: 'admin', expiresAt, elevated: true },
        process.env.JWT_SECRET
      );

      const req = {
        headers: { 'x-elevated-token': token },
        user: { id: '1', role: 'admin' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      requireElevatedSession(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Elevated session expired. Please re-authenticate.',
        code: 'ELEVATED_SESSION_EXPIRED',
        action: 'reauthenticate'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid elevated token', () => {
      const req = {
        headers: { 'x-elevated-token': 'invalid-token' },
        user: { id: '1', role: 'admin' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      requireElevatedSession(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid elevated session token',
        code: 'INVALID_ELEVATED_TOKEN',
        action: 'reauthenticate'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-admin role in elevated token', () => {
      const expiresAt = Date.now() + (15 * 60 * 1000);
      const token = jwt.sign(
        { userId: '1', role: 'user', expiresAt, elevated: true },
        process.env.JWT_SECRET
      );

      const req = {
        headers: { 'x-elevated-token': token },
        user: { id: '1', role: 'admin' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      requireElevatedSession(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnershipOrAdmin', () => {
    it('should allow admin to access any user', () => {
      const req = {
        user: { id: '1', role: 'admin' },
        params: { id: '999' }
      };
      const res = {};
      const next = jest.fn();

      requireOwnershipOrAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow user to access own data', () => {
      const req = {
        user: { id: '1', role: 'user' },
        params: { id: '1' }
      };
      const res = {};
      const next = jest.fn();

      requireOwnershipOrAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject user accessing other user data', () => {
      const req = {
        user: { id: '1', role: 'user' },
        params: { id: '999' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      requireOwnershipOrAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. You can only access your own data.',
        code: 'OWNERSHIP_REQUIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated users', () => {
      const req = {
        params: { id: '1' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      requireOwnershipOrAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle userId from body', () => {
      const req = {
        user: { id: '1', role: 'user' },
        body: { userId: '1' }
      };
      const res = {};
      const next = jest.fn();

      requireOwnershipOrAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle userId from params.userId', () => {
      const req = {
        user: { id: '1', role: 'user' },
        params: { userId: '1' }
      };
      const res = {};
      const next = jest.fn();

      requireOwnershipOrAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject missing user ID', () => {
      const req = {
        user: { id: '1', role: 'user' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      requireOwnershipOrAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'User ID required',
        code: 'USER_ID_REQUIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('logAdminAction', () => {
    it('should log admin action successfully', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const req = {
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        get: jest.fn().mockReturnValue('test-user-agent')
      };

      await logAdminAction('role_change', 'target-user-id', 'admin-id', { test: 'data' }, req);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_auth_logs'),
        expect.arrayContaining([
          'target-user-id',
          'role_change',
          '127.0.0.1',
          'test-user-agent',
          true,
          'admin-id',
          expect.any(String)
        ])
      );
    });

    it('should handle missing request object', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await logAdminAction('role_change', 'target-user-id', 'admin-id', { test: 'data' }, null);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_auth_logs'),
        expect.arrayContaining([
          'target-user-id',
          'role_change',
          null,
          null,
          true,
          'admin-id',
          expect.any(String)
        ])
      );
    });

    it('should handle database errors gracefully', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(
        logAdminAction('role_change', 'target-user-id', 'admin-id', {}, null)
      ).resolves.not.toThrow();

      expect(pool.query).toHaveBeenCalled();
    });

    it('should use req.ip if available', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const req = {
        ip: '192.168.1.1',
        get: jest.fn().mockReturnValue('test-user-agent')
      };

      await logAdminAction('test_action', 'user-id', 'admin-id', {}, req);

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['192.168.1.1'])
      );
    });

    it('should use connection.remoteAddress as fallback', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const req = {
        connection: { remoteAddress: '10.0.0.1' },
        get: jest.fn().mockReturnValue('test-user-agent')
      };

      await logAdminAction('test_action', 'user-id', 'admin-id', {}, req);

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['10.0.0.1'])
      );
    });
  });

  describe('logAuthEvent', () => {
    it('should log successful auth event', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const req = {
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        get: jest.fn().mockReturnValue('test-user-agent')
      };

      await logAuthEvent('user-id', 'login', true, null, req);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_auth_logs'),
        expect.arrayContaining([
          'user-id',
          'login',
          '127.0.0.1',
          'test-user-agent',
          true,
          null
        ])
      );
    });

    it('should log failed auth event with reason', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const req = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-user-agent')
      };

      await logAuthEvent('user-id', 'failed_login', false, 'Invalid password', req);

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          'user-id',
          'failed_login',
          '127.0.0.1',
          'test-user-agent',
          false,
          'Invalid password'
        ])
      );
    });

    it('should handle database errors gracefully', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(
        logAuthEvent('user-id', 'login', true, null, null)
      ).resolves.not.toThrow();

      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('generateElevatedToken', () => {
    beforeEach(() => {
      process.env.JWT_SECRET = 'test-secret';
    });

    it('should generate valid elevated token', () => {
      const result = generateElevatedToken('user-id', 'admin');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      expect(typeof result.token).toBe('string');
      expect(typeof result.expiresAt).toBe('string');

      // Verify token can be decoded
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe('user-id');
      expect(decoded.role).toBe('admin');
      expect(decoded.elevated).toBe(true);
      expect(decoded.expiresAt).toBeDefined();
    });

    it('should set expiration to 15 minutes from now', () => {
      const before = Date.now();
      const result = generateElevatedToken('user-id', 'admin');
      const after = Date.now();

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      const expiresAtTime = decoded.expiresAt;
      const expectedMin = before + (15 * 60 * 1000);
      const expectedMax = after + (15 * 60 * 1000);

      expect(expiresAtTime).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAtTime).toBeLessThanOrEqual(expectedMax);
    });

    it('should return ISO string for expiresAt', () => {
      const result = generateElevatedToken('user-id', 'admin');

      // ISO string should match pattern YYYY-MM-DDTHH:mm:ss.sssZ
      expect(result.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});

