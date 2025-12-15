// Test utilities for React Testing Library
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Mock AuthContext for testing (legacy support)
const MockAuthContext = React.createContext({
  user: null,
  token: null,
  loading: false,
  isAuthenticated: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  updateUser: jest.fn(),
});

export const MockAuthProvider = ({ children, value }) => {
  const defaultValue = {
    user: null,
    token: null,
    loading: false,
    isAuthenticated: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
    ...value,
  };
  
  return (
    <MockAuthContext.Provider value={defaultValue}>
      {children}
    </MockAuthContext.Provider>
  );
};

/**
 * Router wrapper with React Router v7 future flags configured
 * to suppress deprecation warnings during tests
 */
export const TestRouter = ({ children }) => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {children}
    </BrowserRouter>
  );
};

/**
 * Router wrapper with MockAuthProvider for components that need authentication context
 */
export const TestRouterWithAuth = ({ children, authValue }) => {
  return (
    <MockAuthProvider value={authValue}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        {children}
      </BrowserRouter>
    </MockAuthProvider>
  );
};

/**
 * Comprehensive wrapper with all providers (Auth, Theme, Router)
 * Use this for components that need multiple contexts
 */
export const renderWithProviders = (ui, options = {}) => {
  const {
    authValue = {},
    themeValue = {},
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => {
    return (
      <ThemeProvider {...themeValue}>
        <AuthProvider {...authValue}>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            {children}
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    );
  };

  const { render } = require('@testing-library/react');
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Router wrapper with ThemeProvider for components that need theme context
 */
export const TestRouterWithTheme = ({ children, themeValue = {} }) => {
  return (
    <ThemeProvider {...themeValue}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        {children}
      </BrowserRouter>
    </ThemeProvider>
  );
};

/**
 * Router wrapper with both Auth and Theme providers
 */
export const TestRouterWithAllProviders = ({ children, authValue = {}, themeValue = {} }) => {
  return (
    <ThemeProvider {...themeValue}>
      <AuthProvider {...authValue}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          {children}
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

