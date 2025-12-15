/**
 * Integration Test Setup
 * Configures tests to use real Docker server instead of mocks
 * 
 * This file runs AFTER setupTests.js, so we can override mocks here
 */

// Import standard setup (for jest-dom matchers, etc.)
import '@testing-library/jest-dom';

// Configure jsdom to allow cross-origin requests for localhost
// This is needed because jsdom's fetch implementation has CORS restrictions
if (typeof window !== 'undefined' && window.document) {
  // Set resources to 'usable' to allow cross-origin requests
  // This is a jsdom configuration option
  const jsdom = require('jsdom');
  if (jsdom.JSDOM) {
    // Note: This might not work with react-scripts' jsdom setup
    // Alternative: Use node-fetch or configure fetch differently
  }
}

// Use node-fetch for Node.js environment (bypasses jsdom CORS restrictions)
// This allows us to make real HTTP requests in tests without CORS issues
let nodeFetch;
try {
  // node-fetch v2 uses CommonJS
  nodeFetch = require('node-fetch');
  
  // Replace mocked fetch with node-fetch
  if (global.fetch && jest.isMockFunction && jest.isMockFunction(global.fetch)) {
    global.fetch = nodeFetch;
  } else if (typeof global.fetch === 'undefined') {
    global.fetch = nodeFetch;
  }
  
  // Also set window.fetch for compatibility with code that uses window.fetch
  if (typeof window !== 'undefined') {
    window.fetch = nodeFetch;
  }
} catch (e) {
  console.warn('⚠️  node-fetch not available. Integration tests may fail due to CORS restrictions.');
  // Fallback: try to use native fetch if available
  if (global.fetch && jest.isMockFunction && jest.isMockFunction(global.fetch)) {
    delete global.fetch;
  }
}

// Set API URL to Docker server
process.env.REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Suppress console warnings for integration tests
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(' ');
  // Suppress React DevTools message
  if (message.includes('Download the React DevTools')) {
    return;
  }
  // Suppress CORS errors in jsdom (we'll handle them)
  if (message.includes('Cross origin') || message.includes('forbidden')) {
    return;
  }
  originalWarn.apply(console, args);
};

