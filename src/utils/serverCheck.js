/**
 * Server Availability Check Utility
 * 
 * Checks if the backend server is running and available for integration tests.
 * This is used to gracefully skip integration tests when the server is not available.
 */

const SERVER_HEALTH_ENDPOINT = process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL.replace('/api', '/health')
  : 'http://localhost:3001/health';

const SERVER_CHECK_TIMEOUT = 3000; // 3 seconds

/**
 * Check if the server is available
 * @param {number} timeout - Timeout in milliseconds (default: 3000)
 * @returns {Promise<boolean>} - True if server is available, false otherwise
 */
export async function isServerAvailable(timeout = SERVER_CHECK_TIMEOUT) {
  try {
    // Check if fetch is available
    if (typeof fetch === 'undefined') {
      console.warn('⚠️  fetch is not available in test environment');
      return false;
    }

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(SERVER_HEALTH_ENDPOINT, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      
      // Server is available if we get a 200 response
      return response.ok;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Network errors, timeouts, or CORS issues mean server is not available
      if (fetchError.name === 'AbortError') {
        console.warn(`⚠️  Server check timed out after ${timeout}ms`);
      } else {
        console.warn(`⚠️  Server check failed: ${fetchError.message}`);
      }
      return false;
    }
  } catch (error) {
    console.warn(`⚠️  Server check error: ${error.message}`);
    return false;
  }
}

/**
 * Check server availability and throw descriptive error if not available
 * Use this in beforeAll hooks when you want tests to fail if server is not available
 * @param {number} timeout - Timeout in milliseconds (default: 3000)
 * @throws {Error} If server is not available
 */
export async function requireServer(timeout = SERVER_CHECK_TIMEOUT) {
  const available = await isServerAvailable(timeout);
  
  if (!available) {
    const errorMessage = `
❌ Server not available for integration tests

Server endpoint: ${SERVER_HEALTH_ENDPOINT}

To start the server:
  1. Run: npm run start:services:detached
  2. Or: cd server && npm run dev
  3. Or: docker compose up -d

Then wait for the server to be ready and run tests again.
    `.trim();
    
    throw new Error(errorMessage);
  }
  
  console.log(`✅ Server is available at ${SERVER_HEALTH_ENDPOINT}`);
  return true;
}

/**
 * Skip tests if server is not available
 * Use this in beforeAll hooks when you want tests to be skipped gracefully
 * @param {number} timeout - Timeout in milliseconds (default: 3000)
 * @returns {Promise<boolean>} - True if server is available, false if tests should be skipped
 */
export async function skipIfServerUnavailable(timeout = SERVER_CHECK_TIMEOUT) {
  const available = await isServerAvailable(timeout);
  
  if (!available) {
    console.warn(`
⚠️  Server not available - skipping integration tests

Server endpoint: ${SERVER_HEALTH_ENDPOINT}

To run integration tests:
  1. Start the server: npm run start:services:detached
  2. Or: cd server && npm run dev
  3. Then run tests again

These tests will be skipped until the server is available.
    `.trim());
    return false;
  }
  
  console.log(`✅ Server is available - running integration tests`);
  return true;
}

export default {
  isServerAvailable,
  requireServer,
  skipIfServerUnavailable,
  SERVER_HEALTH_ENDPOINT,
};

