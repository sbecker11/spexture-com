/**
 * RBAC Middleware Unit Tests
 * Tests role-based access control middleware functions
 */

const jwt = require('jsonwebtoken');
const {
  requireAdmin,
  requireElevatedSession,
  requireOwnershipOrAdmin,
  logAdminAction,
  logAuthEvent,
  generateElevatedToken,
} = require('../../middleware/rbac');

// Mock the database connection module
jest.mock('../../database/connection', () => ({
  query: jest.fn(),
}));

const { query } = require('../../database/connection');

describe('RBAC Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: null,
      params: {},
      body: {},
      headers: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('jest-user-agent'),
      connection: { remoteAddress: '127.0.0.1' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    query.mockClear();
  });

  describe('requireAdmin', () => {
    it('should call next() for admin user', () => {
      req.user = { id: '123', role: 'admin' };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no user', () => {
      req.user = null;

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for non-admin user', () => {
      req.user = { id: '123', role: 'user' };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireElevatedSession', () => {
    it('should call next() with valid elevated token', () => {
      const userId = '123';
      const role = 'admin';
      const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes from now

      const elevatedToken = jwt.sign(
        { userId, role, expiresAt, elevated: true },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      req.user = { id: userId, role };
      req.headers['x-elevated-token'] = elevatedToken;

      requireElevatedSession(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.elevatedSession).toHaveProperty('userId', userId);
      expect(req.elevatedSession).toHaveProperty('expiresAt', expiresAt);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if no elevated token', () => {
      req.user = { id: '123', role: 'admin' };
      req.headers['x-elevated-token'] = undefined;

      requireElevatedSession(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Elevated session required. Please re-authenticate.',
        code: 'ELEVATED_SESSION_REQUIRED',
        action: 'reauthenticate',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if elevated token is expired', () => {
      const userId = '123';
      const role = 'admin';
      const expiresAt = Date.now() - 1000; // Expired

      const elevatedToken = jwt.sign(
        { userId, role, expiresAt, elevated: true },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      req.user = { id: userId, role };
      req.headers['x-elevated-token'] = elevatedToken;

      requireElevatedSession(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Elevated session expired. Please re-authenticate.',
        code: 'ELEVATED_SESSION_EXPIRED',
        action: 'reauthenticate',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if elevated token has non-admin role', () => {
      const userId = '123';
      const role = 'user';
      const expiresAt = Date.now() + (15 * 60 * 1000);

      const elevatedToken = jwt.sign(
        { userId, role, expiresAt, elevated: true },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      req.user = { id: userId, role };
      req.headers['x-elevated-token'] = elevatedToken;

      requireElevatedSession(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if elevated token is invalid', () => {
      req.user = { id: '123', role: 'admin' };
      req.headers['x-elevated-token'] = 'invalid-token';

      requireElevatedSession(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid elevated session token',
        code: 'INVALID_ELEVATED_TOKEN',
        action: 'reauthenticate',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnershipOrAdmin', () => {
    it('should call next() for admin accessing any user', () => {
      req.user = { id: 'admin-id', role: 'admin' };
      req.params.id = 'user-id';

      requireOwnershipOrAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() for user accessing own data', () => {
      req.user = { id: 'user-id', role: 'user' };
      req.params.id = 'user-id';

      requireOwnershipOrAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no user', () => {
      req.user = null;
      req.params.id = 'user-id';

      requireOwnershipOrAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if no user ID provided', () => {
      req.user = { id: 'user-id', role: 'user' };
      req.params.id = undefined;
      req.body.userId = undefined;

      requireOwnershipOrAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'User ID required',
        code: 'USER_ID_REQUIRED',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for user accessing other user data', () => {
      req.user = { id: 'user-id', role: 'user' };
      req.params.id = 'other-user-id';

      requireOwnershipOrAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. You can only access your own data.',
        code: 'OWNERSHIP_REQUIRED',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should get user ID from req.body.userId if params.id is not available', () => {
      req.user = { id: 'user-id', role: 'user' };
      req.params.id = undefined;
      req.body.userId = 'user-id';

      requireOwnershipOrAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should get user ID from req.params.userId if params.id is not available', () => {
      req.user = { id: 'user-id', role: 'user' };
      req.params.id = undefined;
      req.params.userId = 'user-id';

      requireOwnershipOrAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('logAdminAction', () => {
    it('should log admin action successfully', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      await logAdminAction(
        'role_change',
        'target-user-id',
        'admin-user-id',
        { old_role: 'user', new_role: 'admin' },
        req
      );

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_auth_logs'),
        expect.arrayContaining([
          'target-user-id',
          'role_change',
          '127.0.0.1',
          'jest-user-agent',
          true,
          'admin-user-id',
          expect.any(String), // JSON metadata
        ])
      );
    });

    it('should handle logging without request object', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      await logAdminAction(
        'password_reset',
        'target-user-id',
        'admin-user-id',
        { reset_by_admin: true }
      );

      expect(query).toHaveBeenCalled();
      const callArgs = query.mock.calls[0];
      expect(callArgs[1][2]).toBeNull(); // ip_address
      expect(callArgs[1][3]).toBeNull(); // user_agent
    });

    it('should not throw error if logging fails', async () => {
      query.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        logAdminAction(
          'role_change',
          'target-user-id',
          'admin-user-id',
          {},
          req
        )
      ).resolves.not.toThrow();
    });
  });

  describe('logAuthEvent', () => {
    it('should log auth event successfully', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      await logAuthEvent('user-id', 'login', true, null, req);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_auth_logs'),
        expect.arrayContaining([
          'user-id',
          'login',
          '127.0.0.1',
          'jest-user-agent',
          true,
          null,
        ])
      );
    });

    it('should log failed auth event with reason', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      await logAuthEvent('user-id', 'failed_login', false, 'Invalid password', req);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_auth_logs'),
        expect.arrayContaining([
          'user-id',
          'failed_login',
          '127.0.0.1',
          'jest-user-agent',
          false,
          'Invalid password',
        ])
      );
    });

    it('should handle logging without request object', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      await logAuthEvent('user-id', 'logout', true);

      expect(query).toHaveBeenCalled();
      const callArgs = query.mock.calls[0];
      expect(callArgs[1][2]).toBeNull(); // ip_address
      expect(callArgs[1][3]).toBeNull(); // user_agent
    });

    it('should not throw error if logging fails', async () => {
      query.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        logAuthEvent('user-id', 'login', true, null, req)
      ).resolves.not.toThrow();
    });
  });

  describe('generateElevatedToken', () => {
    it('should generate valid elevated token', () => {
      const userId = '123';
      const role = 'admin';

      const { token, expiresAt } = generateElevatedToken(userId, role);

      expect(token).toBeDefined();
      expect(expiresAt).toBeDefined();

      // Verify token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(userId);
      expect(decoded.role).toBe(role);
      expect(decoded.elevated).toBe(true);
      expect(decoded.expiresAt).toBeDefined();
    });

    it('should generate token with expiration in future', () => {
      const userId = '123';
      const role = 'admin';

      const { token, expiresAt } = generateElevatedToken(userId, role);

      const expiresAtTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const fifteenMinutes = 15 * 60 * 1000;

      // Should be approximately 15 minutes from now (allow 1 second tolerance)
      expect(expiresAtTime).toBeGreaterThan(now);
      expect(expiresAtTime).toBeLessThanOrEqual(now + fifteenMinutes + 1000);
    });

    it('should generate token with ISO string expiration', () => {
      const userId = '123';
      const role = 'admin';

      const { expiresAt } = generateElevatedToken(userId, role);

      // Should be a valid ISO string
      expect(() => new Date(expiresAt)).not.toThrow();
      expect(new Date(expiresAt).toISOString()).toBe(expiresAt);
    });
  });

  describe('requireElevatedSession edge cases', () => {
    it('should handle token with wrong secret', () => {
      const wrongToken = jwt.sign(
        { userId: '123', role: 'admin', expiresAt: Date.now() + 900000, elevated: true },
        'wrong-secret',
        { expiresIn: '15m' }
      );

      req.user = { id: '123', role: 'admin' };
      req.headers['x-elevated-token'] = wrongToken;

      requireElevatedSession(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid elevated session token',
        code: 'INVALID_ELEVATED_TOKEN',
        action: 'reauthenticate',
      });
    });

    it('should handle token without elevated flag', () => {
      const token = jwt.sign(
        { userId: '123', role: 'admin', expiresAt: Date.now() + 900000 },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      req.user = { id: '123', role: 'admin' };
      req.headers['x-elevated-token'] = token;

      // Token should still work if it has the right structure
      requireElevatedSession(req, res, next);
      
      // Should pass if expiresAt is valid
      if (Date.now() < Date.now() + 900000) {
        expect(next).toHaveBeenCalled();
      }
    });
  });

  describe('logAdminAction edge cases', () => {
    it('should handle request with connection.remoteAddress', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      req.connection.remoteAddress = '192.168.1.1';
      req.ip = undefined;

      await logAdminAction(
        'role_change',
        'target-user-id',
        'admin-user-id',
        { test: 'data' },
        req
      );

      const callArgs = query.mock.calls[0][1];
      expect(callArgs[2]).toBe('192.168.1.1'); // ip_address
    });

    it('should handle request with both ip and connection.remoteAddress', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      req.ip = '10.0.0.1';
      req.connection.remoteAddress = '192.168.1.1';

      await logAdminAction(
        'role_change',
        'target-user-id',
        'admin-user-id',
        {},
        req
      );

      const callArgs = query.mock.calls[0][1];
      expect(callArgs[2]).toBe('10.0.0.1'); // Should prefer req.ip
    });

    it('should handle complex metadata objects', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      const complexMetadata = {
        old_role: 'user',
        new_role: 'admin',
        user_email: 'test@example.com',
        nested: {
          data: [1, 2, 3],
          timestamp: new Date().toISOString(),
        },
      };

      await logAdminAction(
        'role_change',
        'target-user-id',
        'admin-user-id',
        complexMetadata,
        req
      );

      const callArgs = query.mock.calls[0][1];
      const metadata = JSON.parse(callArgs[6]);
      expect(metadata).toEqual(complexMetadata);
    });
  });

  describe('logAuthEvent edge cases', () => {
    it('should handle request without ip or connection', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      req.ip = undefined;
      req.connection = undefined;

      await logAuthEvent('user-id', 'login', true, null, req);

      const callArgs = query.mock.calls[0][1];
      expect(callArgs[2]).toBeNull(); // ip_address
      expect(callArgs[3]).toBeNull(); // user_agent
    });

    it('should handle all auth event types', async () => {
      query.mockResolvedValue({ rows: [] });
      const eventTypes = ['login', 'logout', 'failed_login', 'password_reset', 'account_locked'];

      for (const eventType of eventTypes) {
        await logAuthEvent('user-id', eventType, true, null, req);
      }

      expect(query).toHaveBeenCalledTimes(eventTypes.length);
    });
  });
});

