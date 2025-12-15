/**
 * Database Connection Tests
 * Tests for database connection and query utilities
 */

const { Pool } = require('pg');
const { pool, query, getClient } = require('../database/connection');

// Mock pg module
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn(),
  };

  return {
    Pool: jest.fn(() => mockPool),
  };
});

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
  });

  describe('Pool Configuration', () => {
    it('should export pool with query and connect methods', () => {
      // Verify pool is properly exported and has required methods
      expect(pool).toBeDefined();
      expect(pool.query).toBeDefined();
      expect(pool.connect).toBeDefined();
      expect(typeof pool.query).toBe('function');
      expect(typeof pool.connect).toBe('function');
    });

    it('should have pool configured with max connections', () => {
      // Pool was created with configuration at module load
      // Verify it exists and can be mocked for testing
      expect(Pool).toHaveBeenCalled();
      const poolConfig = Pool.mock.calls[0][0];
      expect(poolConfig).toBeDefined();
      expect(poolConfig.max).toBe(20);
      expect(poolConfig.idleTimeoutMillis).toBe(30000);
      expect(poolConfig.connectionTimeoutMillis).toBe(2000);
    });
  });

  describe('Pool Event Handlers', () => {
    it('should register connect and error event handlers', () => {
      // Verify that pool.on was called to set up event handlers
      expect(pool.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(pool.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle error event by exiting process', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Get the error handler that was registered
      const errorCall = pool.on.mock.calls.find(call => call[0] === 'error');
      expect(errorCall).toBeDefined();

      const errorHandler = errorCall[1];
      const testError = new Error('Test database error');

      // Call the error handler
      errorHandler(testError);

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Unexpected error on idle client', testError);
      expect(mockExit).toHaveBeenCalledWith(-1);

      mockExit.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('query function', () => {
    it('should execute query successfully', async () => {
      const mockResult = { rows: [{ id: 1, name: 'Test' }], rowCount: 1 };
      pool.query.mockResolvedValue(mockResult);

      const result = await query('SELECT * FROM users WHERE id = $1', [1]);

      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
      expect(result).toEqual(mockResult);
    });

    it('should log query execution time', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const mockResult = { rows: [], rowCount: 0 };
      pool.query.mockResolvedValue(mockResult);

      await query('SELECT * FROM users', []);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Executed query',
        expect.objectContaining({
          text: 'SELECT * FROM users',
          duration: expect.any(Number),
          rows: 0,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle query errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const dbError = new Error('Database connection failed');
      pool.query.mockRejectedValue(dbError);

      await expect(query('SELECT * FROM users', [])).rejects.toThrow('Database connection failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Database query error:', dbError);

      consoleErrorSpy.mockRestore();
    });

    it('should measure query duration', async () => {
      const mockResult = { rows: [], rowCount: 0 };
      pool.query.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(mockResult), 10);
        });
      });

      const start = Date.now();
      await query('SELECT * FROM users', []);
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(10);
    });
  });

  describe('getClient function', () => {
    it('should get client from pool', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);

      const client = await getClient();

      expect(pool.connect).toHaveBeenCalled();
      expect(client).toBeDefined();
    });

    it('should set up timeout warning for long-running queries', async () => {
      jest.useFakeTimers();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);

      await getClient();

      // Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'A client has been checked out for more than 5 seconds!'
      );

      jest.useRealTimers();
      consoleErrorSpy.mockRestore();
    });

    it('should monkey patch query method to track last query', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);

      const client = await getClient();

      await client.query('SELECT * FROM users', []);

      expect(client.lastQuery).toEqual(['SELECT * FROM users', []]);
    });

    it('should restore original methods on release', async () => {
      const originalQuery = jest.fn().mockResolvedValue({ rows: [] });
      const originalRelease = jest.fn();
      const mockClient = {
        query: originalQuery,
        release: originalRelease,
      };
      pool.connect.mockResolvedValue(mockClient);

      const client = await getClient();
      const patchedQuery = client.query;
      const patchedRelease = client.release;

      // Verify methods were patched
      expect(client.query).not.toBe(originalQuery);
      expect(client.release).not.toBe(originalRelease);

      await patchedRelease();

      // Verify original release was called
      expect(originalRelease).toHaveBeenCalled();

      // After release, methods are restored to bound versions
      expect(client.query).not.toBe(patchedQuery);
      expect(client.release).toBe(originalRelease);
    });

    it('should clear timeout on release', async () => {
      jest.useFakeTimers();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);

      const client = await getClient();
      const release = client.release;

      // Fast-forward 3 seconds
      jest.advanceTimersByTime(3000);

      // Release client
      await release();

      // Fast-forward another 3 seconds (total 6 seconds)
      jest.advanceTimersByTime(3000);

      // Should not have logged error because timeout was cleared
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      jest.useRealTimers();
      consoleErrorSpy.mockRestore();
    });
  });
});

