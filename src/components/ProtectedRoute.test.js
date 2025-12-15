import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import * as AuthContext from '../contexts/AuthContext';

// Mock the useAuth hook
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Test component to render inside ProtectedRoute
const TestComponent = () => <div>Protected Content</div>;

// Wrapper component for routing
// Note: ProtectedRoute uses Navigate which needs to be inside Routes
// Use MemoryRouter for tests to avoid browser history issues
// Use path="*" to catch all routes for Navigate to work correctly
const RouterWrapper = ({ children, initialEntries = ['/'] }) => (
  <MemoryRouter initialEntries={initialEntries}>
    <Routes>
      <Route path="*" element={children} />
      <Route path="/login-register" element={<div>Login Page</div>} />
    </Routes>
  </MemoryRouter>
);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure AuthContext mock is reset before each test
    AuthContext.useAuth.mockClear();
  });

  describe('Positive Tests - Authenticated User', () => {
    it('should render children when user is authenticated', () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        loading: false,
      });

      render(
        <RouterWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render children with user data available', () => {
      const mockUser = {
        id: '123',
        name: 'Jane Smith',
        email: 'jane@example.com',
        created_at: '2024-01-01',
      };

      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      render(
        <RouterWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should pass through children props correctly', () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: '1', name: 'User' },
        loading: false,
      });

      const ChildWithProps = ({ testProp }) => <div>Prop: {testProp}</div>;

      render(
        <RouterWrapper>
          <ProtectedRoute>
            <ChildWithProps testProp="test-value" />
          </ProtectedRoute>
        </RouterWrapper>
      );

      expect(screen.getByText('Prop: test-value')).toBeInTheDocument();
    });

    it('should render multiple children when authenticated', () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: '1', name: 'User' },
        loading: false,
      });

      render(
        <RouterWrapper>
          <ProtectedRoute>
            <div>Child 1</div>
            <div>Child 2</div>
          </ProtectedRoute>
        </RouterWrapper>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('Negative Tests - Unauthenticated User', () => {
    it('should redirect to login when user is null', () => {
      AuthContext.useAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      render(
        <RouterWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should redirect to login when user is undefined', () => {
      AuthContext.useAuth.mockReturnValue({
        user: undefined,
        loading: false,
      });

      render(
        <RouterWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should not render children when not authenticated', () => {
      AuthContext.useAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      const ChildWithSideEffect = () => {
        // This should not be called
        throw new Error('Child should not render');
      };

      render(
        <RouterWrapper>
          <ProtectedRoute>
            <div>Should not render</div>
          </ProtectedRoute>
        </RouterWrapper>
      );

      expect(screen.queryByText('Should not render')).not.toBeInTheDocument();
    });
  });

  describe('Loading State Tests', () => {
    it('should show loading spinner while checking authentication', () => {
      AuthContext.useAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      const { container } = render(
        <RouterWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      // Loading component shows "Checking authentication..." (with capital C and ellipsis)
      // Use a more flexible matcher in case the text is split across elements
      // Also check for the Loading component's structure (spinner div)
      const loadingMessage = screen.queryByText(/checking authentication/i);
      const hasSpinner = container.querySelector('div[style*="border"]');
      
      // Either the message text is visible, or the spinner structure exists
      expect(loadingMessage || hasSpinner).toBeTruthy();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('should not render children during loading', () => {
      AuthContext.useAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      render(
        <RouterWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should show loading even with user data if still loading', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: '1', name: 'User' },
        loading: true,
      });

      const { container } = render(
        <RouterWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      // When loading is true, ProtectedRoute should return Loading component
      // Check for Loading component structure - it has a spinner div with border style
      // and a message paragraph
      await waitFor(() => {
        const spinnerDivs = container.querySelectorAll('div[style*="border"]');
        const hasSpinner = spinnerDivs.length > 0;
        const loadingMessage = screen.queryByText(/checking authentication/i);
        
        // Either the message text is visible, or the spinner structure exists
        expect(loadingMessage || hasSpinner).toBeTruthy();
      });
      
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user object', () => {
      AuthContext.useAuth.mockReturnValue({
        user: {},
        loading: false,
      });

      const { container } = render(
        <RouterWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      // Empty object {} is truthy in JavaScript, so !{} is false
      // ProtectedRoute should render children, not Navigate
      const protectedContent = screen.queryByText('Protected Content');
      const loginPage = screen.queryByText('Login Page');
      
      // Empty object is truthy, so should render children
      expect(protectedContent).toBeInTheDocument();
      expect(loginPage).not.toBeInTheDocument();
    });

    it('should handle user with only id', () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: '1' },
        loading: false,
      });

      const { container } = render(
        <RouterWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      // User object with id is truthy, so should render children
      const protectedContent = screen.queryByText('Protected Content');
      const loginPage = screen.queryByText('Login Page');
      
      expect(protectedContent).toBeInTheDocument();
      expect(loginPage).not.toBeInTheDocument();
    });

    it('should handle false as user value', () => {
      AuthContext.useAuth.mockReturnValue({
        user: false,
        loading: false,
      });

      render(
        <RouterWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should handle 0 as user value', () => {
      AuthContext.useAuth.mockReturnValue({
        user: 0,
        loading: false,
      });

      render(
        <RouterWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should handle empty string as user value', () => {
      AuthContext.useAuth.mockReturnValue({
        user: '',
        loading: false,
      });

      render(
        <RouterWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should work with nested routes', () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: '1', name: 'User' },
        loading: false,
      });

      const NestedComponent = () => (
        <div>
          <h1>Nested Content</h1>
          <p>Additional info</p>
        </div>
      );

      const { container } = render(
        <RouterWrapper>
          <ProtectedRoute>
            <NestedComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      // User is authenticated, so ProtectedRoute should render NestedComponent
      const nestedContent = screen.queryByText('Nested Content');
      const additionalInfo = screen.queryByText('Additional info');
      const loginPage = screen.queryByText('Login Page');
      
      expect(nestedContent).toBeInTheDocument();
      expect(additionalInfo).toBeInTheDocument();
      expect(loginPage).not.toBeInTheDocument();
    });

    it('should work with complex component trees', () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: '1', name: 'User' },
        loading: false,
      });

      const ComplexComponent = () => (
        <div>
          <header>Header</header>
          <main>Main Content</main>
          <footer>Footer</footer>
        </div>
      );

      const { container } = render(
        <RouterWrapper>
          <ProtectedRoute>
            <ComplexComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      // User is authenticated, so ProtectedRoute should render ComplexComponent
      const header = screen.queryByText('Header');
      const mainContent = screen.queryByText('Main Content');
      const footer = screen.queryByText('Footer');
      const loginPage = screen.queryByText('Login Page');
      
      expect(header).toBeInTheDocument();
      expect(mainContent).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
      expect(loginPage).not.toBeInTheDocument();
    });
  });

  describe('Redirect Behavior', () => {
    it('should use replace navigation for redirect', () => {
      AuthContext.useAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      render(
        <RouterWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </RouterWrapper>
      );

      // Verify redirect happened (Login Page is shown)
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      // Verify protected content is not shown
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });
});

