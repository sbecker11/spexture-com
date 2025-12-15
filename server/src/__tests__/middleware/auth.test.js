/**
 * Authentication Middleware Unit Tests
 */

const jwt = require('jsonwebtoken');
const { authenticate } = require('../../middleware/auth');
const { query } = require('../../database/connection');

// Mock database connection
jest.mock('../../database/connection', () => ({
  query: jest.fn(),
}));

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('No token provided', () => {
    it('should return 401 if no Authorization header', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if Authorization header does not start with Bearer', async () => {
      req.headers.authorization = 'Invalid token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Invalid token', () => {
    it('should return 401 if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is expired', async () => {
      const expiredToken = jwt.sign(
        { userId: '123', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      req.headers.authorization = `Bearer ${expiredToken}`;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Valid token', () => {
    it('should authenticate user with valid token', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const token = jwt.sign(
        { userId, email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers.authorization = `Bearer ${token}`;

      // Mock database query to return user
      query.mockResolvedValueOnce({
        rows: [{
          id: userId,
          name: 'Test User',
          email: email,
          role: 'user',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      await authenticate(req, res, next);

      expect(query).toHaveBeenCalledWith(
        'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );
      expect(req.user).toHaveProperty('id', userId);
      expect(req.user).toHaveProperty('email', email);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found in database', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const token = jwt.sign(
        { userId, email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers.authorization = `Bearer ${token}`;

      // Mock database query to return no user
      query.mockResolvedValueOnce({ rows: [] });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return 500 if database query fails', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const token = jwt.sign(
        { userId, email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers.authorization = `Bearer ${token}`;

      // Mock database query to throw error
      query.mockRejectedValueOnce(new Error('Database error'));

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication error' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

