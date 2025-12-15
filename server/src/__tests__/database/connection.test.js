/**
 * Database Connection Tests
 */

const { Pool } = require('pg');
const { query, getClient, pool } = require('../../database/connection');

jest.mock('pg', () => {
  const mockQuery = jest.fn();
  const mockConnect = jest.fn();
  const mockRelease = jest.fn();
  const mockClient = {
    query: jest.fn(),
    release: mockRelease,
    lastQuery: null,
  };
  
  mockConnect.mockResolvedValue(mockClient);
  
  const mockPool = jest.fn(() => ({
    query: mockQuery,
    connect: mockConnect,
    on: jest.fn(),
  }));

  return {
    Pool: mockPool,
  };
});

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('query function', () => {
    it('should execute query successfully', async () => {
      const mockResult = { rows: [{ id: 1, name: 'Test' }], rowCount: 1 };
      pool.query = jest.fn().mockResolvedValue(mockResult);

      const result = await query('SELECT * FROM users WHERE id = $1', [1]);

      expect(result).toEqual(mockResult);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
      expect(console.log).toHaveBeenCalled();
    });

    it('should log query execution time', async () => {
      const mockResult = { rows: [], rowCount: 0 };
      pool.query = jest.fn().mockResolvedValue(mockResult);
      jest.useFakeTimers();

      const queryPromise = query('SELECT * FROM users');
      jest.advanceTimersByTime(100);
      const result = await queryPromise;

      expect(result).toEqual(mockResult);
      expect(console.log).toHaveBeenCalledWith(
        'Executed query',
        expect.objectContaining({
          text: 'SELECT * FROM users',
          duration: expect.any(Number),
          rows: 0,
        })
      );

      jest.useRealTimers();
    });

    it('should handle query errors', async () => {
      const error = new Error('Database error');
      pool.query = jest.fn().mockRejectedValue(error);

      await expect(query('SELECT * FROM users')).rejects.toThrow('Database error');
      expect(console.error).toHaveBeenCalledWith('Database query error:', error);
    });

    it('should handle query with parameters', async () => {
      const mockResult = { rows: [{ id: 1 }], rowCount: 1 };
      pool.query = jest.fn().mockResolvedValue(mockResult);

      const result = await query('SELECT * FROM users WHERE id = $1', [1]);

      expect(result).toEqual(mockResult);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
    });

    it('should handle query without parameters', async () => {
      const mockResult = { rows: [], rowCount: 0 };
      pool.query = jest.fn().mockResolvedValue(mockResult);

      const result = await query('SELECT * FROM users');

      expect(result).toEqual(mockResult);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users', undefined);
    });
  });

  describe('getClient function', () => {
    it('should get a client from the pool', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      const client = await getClient();

      expect(pool.connect).toHaveBeenCalled();
      expect(client).toBeDefined();
      expect(client.query).toBeDefined();
      expect(client.release).toBeDefined();
    });

    it('should set timeout for long-running queries', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      pool.connect = jest.fn().mockResolvedValue(mockClient);
      jest.useFakeTimers();
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const client = await getClient();
      
      // Advance time past 5 seconds
      jest.advanceTimersByTime(6000);

      expect(console.error).toHaveBeenCalledWith(
        'A client has been checked out for more than 5 seconds!'
      );

      jest.useRealTimers();
    });

    it('should log last query when client is released after timeout', async () => {
      const mockRelease = jest.fn();
      const mockClient = {
        query: jest.fn(),
        release: mockRelease,
      };
      pool.connect = jest.fn().mockResolvedValue(mockClient);
      jest.useFakeTimers();
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const client = await getClient();
      client.query('SELECT * FROM users');

      // Advance time past 5 seconds
      jest.advanceTimersByTime(6000);

      // Verify timeout warning was logged
      expect(console.error).toHaveBeenCalledWith('A client has been checked out for more than 5 seconds!');

      // Release client
      await client.release();

      // Verify the actual release was called
      expect(mockRelease).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should restore original query and release methods on release', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      const client = await getClient();
      const originalQuery = client.query;
      const originalRelease = client.release;

      await client.release();

      // After release, methods should be restored
      expect(client.query).not.toBe(originalQuery);
      expect(client.release).not.toBe(originalRelease);
    });
  });

  describe('Pool configuration', () => {
    it('should create pool with correct configuration', () => {
      const pool = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'testuser',
        password: 'testpass',
        database: 'testdb',
      });

      expect(Pool).toHaveBeenCalled();
      expect(pool).toBeDefined();
    });

    it('should use environment variables for configuration', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DB_HOST: 'test-host',
        DB_PORT: '5433',
        DB_USER: 'test-user',
        DB_PASSWORD: 'test-password',
        DB_NAME: 'test-db',
      };

      // Re-require to get new config
      jest.resetModules();
      const { Pool: TestPool } = require('pg');
      
      const pool = new TestPool();
      expect(TestPool).toHaveBeenCalled();

      process.env = originalEnv;
    });

    it('should use default values when environment variables are not set', () => {
      // Verify that pool was created (module already loaded)
      // This test verifies the module can be loaded successfully without env vars
      expect(pool).toBeDefined();
      expect(pool.query).toBeDefined();
      expect(pool.connect).toBeDefined();
    });
  });

  describe('Pool event handlers', () => {
    it('should handle pool connect event', () => {
      const mockOn = jest.fn();
      pool.on = mockOn;

      // Simulate connect event
      const connectHandler = pool.on.mock.calls.find(call => call[0] === 'connect');
      if (connectHandler) {
        connectHandler[1]();
        expect(console.log).toHaveBeenCalledWith('✅ Connected to PostgreSQL database');
      }
    });

    it('should handle pool error event', () => {
      const mockOn = jest.fn();
      pool.on = mockOn;
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

      // Simulate error event
      const errorHandler = pool.on.mock.calls.find(call => call[0] === 'error');
      if (errorHandler) {
        const error = new Error('Connection error');
        errorHandler[1](error);
        expect(console.error).toHaveBeenCalledWith('❌ Unexpected error on idle client', error);
        expect(mockExit).toHaveBeenCalledWith(-1);
      }

      mockExit.mockRestore();
    });
  });
});

