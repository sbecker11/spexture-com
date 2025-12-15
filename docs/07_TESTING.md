# 🧪 Testing Guide

Complete guide to testing the Spexture-com, including client tests, server tests, and coverage analysis.

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Running Tests](#-running-tests)
3. [Test Structure](#-test-structure)
4. [Coverage Analysis](#-coverage-analysis)
5. [Writing Tests](#-writing-tests)
6. [Best Practices](#-best-practices)
7. [Troubleshooting](#-troubleshooting)

---

## 📊 Overview

### Test Statistics

| Category | Tests | Coverage | Status |
|----------|-------|----------|--------|
| **Client** | 69+ | 52% | ✅ Passing |
| **Server** | 27+ | 47% | ✅ Passing |
| **Total** | 96+ | 50% | ✅ All Passing |

### Technology Stack

- **Client Testing**: Jest + React Testing Library
- **Server Testing**: Jest + Supertest
- **Coverage**: Istanbul (via Jest)
- **CI/CD**: Ready for GitHub Actions

---

## 🚀 Running Tests

### Quick Commands

```bash
# Client tests (watch mode)
npm test

# Client tests with coverage
npm run test:coverage

# Server tests
cd server && npm test

# All tests
npm run test:all
```

### Client Tests

#### Watch Mode (Development)
```bash
npm test
# Interactive mode - tests re-run on file changes
# Press 'a' to run all tests
# Press 'p' to filter by filename
# Press 'q' to quit
```

#### Run Once (CI/CD)
```bash
npm test -- --watchAll=false
```

#### With Coverage Report
```bash
npm run test:coverage
# Generates coverage/ directory with HTML report
# Open coverage/lcov-report/index.html in browser
```

#### Specific Test File
```bash
npm test -- LoginRegister.test.js
npm test -- src/services/api.test.js
```

#### Pattern Matching
```bash
npm test -- --testNamePattern="renders"
npm test -- --testNamePattern="validation"
```

### Server Tests

#### All Server Tests
```bash
cd server
npm test
```

#### With Coverage
```bash
cd server
npm test -- --coverage
```

#### Specific Test Suite
```bash
cd server
npm test -- middleware/auth.test.js
npm test -- routes/admin.unit.test.js
```

#### API Integration Tests (Requires Database)
```bash
# Start database first
npm run db:init

# Run API tests
cd server
npm test -- api.test.js
```

---

## 🗂️ Test Structure

### Client Test Files

```
src/
├── __tests__/
│   └── test-utils.js              # Test utilities
├── services/
│   └── api.test.js                # API service (16 tests)
└── components/
    ├── LoginRegister.test.js      # Auth forms (53 tests)
    ├── Header.test.js             # Navigation
    ├── ProtectedRoute.test.js     # Route protection
    ├── AdminAuthModal.test.js     # Admin re-auth
    ├── ErrorBoundary.test.js      # Error handling
    ├── Loading.test.js            # Spinner
    ├── NotFound.test.js           # 404 page
    ├── Home.test.js               # Home page
    ├── About.test.js              # About page
    ├── Left.test.js               # Sidebar
    ├── Footer.test.js             # Footer
    └── JDAnalyzer.test.js         # Analyzer
```

### Server Test Files

```
server/src/
└── __tests__/
    ├── setup.js                    # Test configuration
    ├── api.test.js                 # API integration tests
    ├── admin.test.js               # Admin endpoint tests
    ├── rbac.test.js                # RBAC tests
    ├── database.test.js            # Database tests
    ├── middleware/
    │   ├── auth.test.js            # Auth middleware
    │   └── rbac.test.js            # RBAC middleware
    ├── routes/
    │   └── admin.unit.test.js      # Admin routes
    └── database/
        └── connection.test.js      # DB connection
```

---

## 📈 Coverage Analysis

### Current Coverage

#### Client Coverage (52%)
- **Statements**: 52.41%
- **Branches**: 37.14%
- **Functions**: 47.22%
- **Lines**: 52.51%

**Well-Covered Files**:
- `src/services/api.js` - 100%
- `src/components/Loading.js` - 100%
- `src/components/ErrorBoundary.js` - 95%

**Need Attention**:
- `src/components/UserManagement.js` - 1.01%
- `src/components/AdminDashboard.js` - 20%
- `src/validation/fieldValidation.js` - 0%

#### Server Coverage (47%)
- **Statements**: 47.33%
- **Branches**: 29.55%
- **Functions**: 44.44%
- **Lines**: 47.46%

**Well-Covered Files**:
- `server/src/middleware/auth.js` - 89.47%
- `server/src/database/connection.js` - 100%

**Need Attention**:
- `server/src/routes/admin.js` - 8.59%
- `server/src/middleware/rbac.js` - 40.82%

### View Coverage Report

```bash
# Generate coverage
npm run test:coverage

# Open HTML report in browser
open coverage/lcov-report/index.html
```

### Coverage Goals

- **Target**: 70% overall coverage
- **Threshold**: 60% (configured in jest config)
- **Focus Areas**: Admin components, RBAC middleware, validation

---

## ✍️ Writing Tests

### Client Component Test Example

```javascript
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import MyComponent from './MyComponent';

// Test with all providers
function renderWithProviders(component) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('MyComponent', () => {
  test('renders successfully', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('handles user interaction', async () => {
    renderWithProviders(<MyComponent />);
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### API Service Test Example

```javascript
import { authAPI } from './api';
import axios from 'axios';

jest.mock('axios');

describe('authAPI', () => {
  test('registers user successfully', async () => {
    const mockResponse = { data: { token: 'abc123', user: { id: 1 } } };
    axios.post.mockResolvedValue(mockResponse);

    const result = await authAPI.register({
      name: 'Test',
      email: 'test@example.com',
      password: 'Test123!'
    });

    expect(result.data.token).toBe('abc123');
    expect(axios.post).toHaveBeenCalledWith(
      '/auth/register',
      expect.any(Object)
    );
  });
});
```

### Server API Test Example

```javascript
const request = require('supertest');
const app = require('../src/index');

describe('Auth API', () => {
  test('POST /api/auth/register creates user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123!'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe('test@example.com');
  });

  test('POST /api/auth/login returns token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@spexture-com.local',
        password: 'Admin123!'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

### Server Middleware Test Example

```javascript
const { requireAuth } = require('../middleware/auth');

describe('requireAuth middleware', () => {
  test('allows request with valid token', async () => {
    const req = {
      headers: { authorization: 'Bearer valid-token' }
    };
    const res = {};
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });

  test('rejects request without token', async () => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
```

---

## 📝 Best Practices

### Testing Principles

1. **Test Behavior, Not Implementation**
   - Focus on what the component does, not how it does it
   - Test user interactions, not internal state

2. **Use Testing Library Queries**
   - `getByRole` - Preferred (most accessible)
   - `getByLabelText` - For form fields
   - `getByText` - For content
   - Avoid `getByTestId` unless necessary

3. **Mock External Dependencies**
   - Mock API calls
   - Mock localStorage
   - Mock AuthContext when needed

4. **Test Happy Path and Error Cases**
   - Test successful operations
   - Test validation errors
   - Test API errors
   - Test loading states

5. **Keep Tests Fast**
   - Mock slow operations
   - Use in-memory database for tests
   - Avoid real API calls

### Common Patterns

#### Mocking AuthContext
```javascript
const mockAuthContext = {
  user: { id: '123', name: 'Test User', role: 'user' },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  isAdmin: jest.fn(() => false)
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));
```

#### Testing Protected Routes
```javascript
test('redirects to login if not authenticated', () => {
  const mockAuthContext = { isAuthenticated: false };
  // ... render with mocked context
  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
});
```

#### Testing Form Submission
```javascript
test('submits form with valid data', async () => {
  render(<LoginRegister />);

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'Test123!' }
  });

  fireEvent.click(screen.getByRole('button', { name: /login/i }));

  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalled();
  });
});
```

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: "Not wrapped in act(...)"

**Cause**: Async state updates not properly handled

**Solution**:
```javascript
await waitFor(() => {
  expect(screen.getByText('Result')).toBeInTheDocument();
});
```

#### Issue: "Cannot find module 'AuthContext'"

**Cause**: Missing mock or wrong path

**Solution**:
```javascript
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: {} })
}));
```

#### Issue: Server tests fail with database error

**Cause**: Database not running

**Solution**:
```bash
npm run db:init  # Start database first
cd server && npm test
```

#### Issue: "ReferenceError: localStorage is not defined"

**Cause**: localStorage not available in test environment

**Solution**: Use test-utils.js setup or mock it
```javascript
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
```

### Debug Tests

```bash
# Run specific test file with verbose output
npm test -- --verbose LoginRegister.test.js

# Run with no cache
npm test -- --no-cache

# Show coverage for specific file
npm test -- --coverage --collectCoverageFrom="src/components/Header.js"
```

---

## 📚 Additional Resources

### Internal Documentation
- **Getting Started**: [`01_GETTING_STARTED.md`](./01_GETTING_STARTED.md)
- **Client Guide**: [`06_CLIENT.md`](./06_CLIENT.md)
- **Server API**: [`05_SERVER.md`](./05_SERVER.md)

### External Resources
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Test Status**: ✅ 96+ Tests Passing
**Coverage**: 🟡 50% (Target: 70%)
**CI/CD Ready**: ✅ Yes
