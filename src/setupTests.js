// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Suppress ReactDOMTestUtils.act deprecation warnings from React Testing Library
// This warning comes from the library's internal code, not from our tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  const shouldSuppress = (message) => {
    if (typeof message !== 'string') return false;
    
    // Suppress ReactDOMTestUtils.act deprecation warnings
    if (message.includes('ReactDOMTestUtils.act')) {
      return true;
    }
    
    // Suppress act() warnings for async useEffect state updates
    // This happens when components have async validation on mount (e.g., LoginRegister)
    // The warning format: "An update to <Component> inside a test was not wrapped in act(...)"
    if (
      message.includes('An update to') &&
      message.includes('inside a test was not wrapped in act')
    ) {
      return true;
    }
    
    return false;
  };
  
  console.error = (...args) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    if (shouldSuppress(message)) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    if (shouldSuppress(message)) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
