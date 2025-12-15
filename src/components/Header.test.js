// FILEPATH: /Users/sbecker11/workspace-react/spexture-com/src/components/Header.test.js

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { TestRouterWithAllProviders } from "../test-utils";
import Header from "./Header";
import * as api from "../services/api";
import * as AuthContext from "../contexts/AuthContext";

import { onHomeClick } from "./Home.test";
import { onAboutClick } from "./About.test";
import { onLoginRegisterClick } from "./LoginRegister.test";

// Mock authAPI.getCurrentUser to prevent real API calls in AuthProvider
jest.mock('../services/api', () => {
  const actual = jest.requireActual('../services/api');
  return {
    ...actual,
    authAPI: {
      ...actual.authAPI,
      getCurrentUser: jest.fn().mockRejectedValue(new Error('Not authenticated')),
    },
  };
});

// Mock AuthContext for branch coverage tests
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: jest.fn(),
}));

describe("Header", () => {
  beforeEach(() => {
    localStorage.removeItem('token');
    jest.clearAllMocks();
    // Set default mock return value for useAuth
    AuthContext.useAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: jest.fn(() => false),
      hasElevatedSession: jest.fn(() => false),
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders without crashing", async () => {
    render(
      <TestRouterWithAllProviders>
        <Header
          onHomeClick={() => {}}
          onAboutClick={() => {}}
          onLoginRegisterClick={() => {}}
        />
      </TestRouterWithAllProviders>
    );
    // Wait for AuthProvider to finish loading
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });

  it("displays home link", async () => {
    render(
      <TestRouterWithAllProviders>
        <Header
          onHomeClick={() => {}}
          onAboutClick={() => {}}
          onLoginRegisterClick={() => {}}
        />
      </TestRouterWithAllProviders>
    );
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });

  it("displays about link", async () => {
    render(
      <TestRouterWithAllProviders>
        <Header
          onHomeClick={() => {}}
          onAboutClick={() => {}}
          onLoginRegisterClick={() => {}}
        />
      </TestRouterWithAllProviders>
    );
    await waitFor(() => {
      expect(screen.getByText("About")).toBeInTheDocument();
    });
  });

  it("displays login/register link", async () => {
    render(
      <TestRouterWithAllProviders>
        <Header
          onHomeClick={() => {}}
          onAboutClick={() => {}}
          onLoginRegisterClick={() => {}}
        />
      </TestRouterWithAllProviders>
    );
    await waitFor(() => {
      expect(screen.getByText("Login/Register")).toBeInTheDocument();
    });
  });

  it("calls onHomeClick when home link is clicked", async () => {
    render(
      <TestRouterWithAllProviders>
        <Header
          onHomeClick={onHomeClick}
          onAboutClick={() => {}}
          onLoginRegisterClick={() => {}}
        />
      </TestRouterWithAllProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/home/i)).toBeInTheDocument();
    });

    // Get the Home link and click it
    const homeLink = screen.getByText(/home/i);
    fireEvent.click(homeLink);
    expect(onHomeClick).toHaveBeenCalled();
  });

  it("calls onAboutClick when about link is clicked", async () => {
    render(
      <TestRouterWithAllProviders>
        <Header
          onHomeClick={() => {}}
          onAboutClick={onAboutClick}
          onLoginRegisterClick={() => {}}
        />
      </TestRouterWithAllProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/about/i)).toBeInTheDocument();
    });

    // Get the About link and click it
    const aboutLink = screen.getByText(/about/i);
    fireEvent.click(aboutLink);
    expect(onAboutClick).toHaveBeenCalled();
  });

  it("calls onLoginRegisterClick when login/register link is clicked", async () => {
    render(
      <TestRouterWithAllProviders>
        <Header
          onHomeClick={() => {}}
          onAboutClick={() => {}}
          onLoginRegisterClick={onLoginRegisterClick}
        />
      </TestRouterWithAllProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/login\/register/i)).toBeInTheDocument();
    });

    // Get the LoginRegister link and click it
    const loginRegisterLink = screen.getByText(/login\/register/i);
    fireEvent.click(loginRegisterLink);
    expect(onLoginRegisterClick).toHaveBeenCalled();
  });

  // Branch coverage tests for authenticated states
  describe('Branch coverage - authenticated states', () => {
    beforeEach(() => {
      // Clear any previous mocks
      jest.clearAllMocks();
    });


    it('shows authenticated user links when user is authenticated', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, name: 'Test User', email: 'test@example.com' },
        token: 'test-token',
        isAuthenticated: true,
        isAdmin: jest.fn(() => false),
        hasElevatedSession: jest.fn(() => false),
      });

      render(
        <TestRouterWithAllProviders>
          <Header
            onHomeClick={() => {}}
            onAboutClick={() => {}}
            onLoginRegisterClick={() => {}}
          />
        </TestRouterWithAllProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Analyzer')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.queryByText('Login/Register')).not.toBeInTheDocument();
      });
    });

    it('shows admin link when user is authenticated and is admin', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
        token: 'test-token',
        isAuthenticated: true,
        isAdmin: jest.fn(() => true),
        hasElevatedSession: jest.fn(() => false),
      });

      render(
        <TestRouterWithAllProviders>
          <Header
            onHomeClick={() => {}}
            onAboutClick={() => {}}
            onLoginRegisterClick={() => {}}
          />
        </TestRouterWithAllProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument();
      });
    });

    it('does not show admin link when user is authenticated but not admin', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, name: 'Regular User', email: 'user@example.com' },
        token: 'test-token',
        isAuthenticated: true,
        isAdmin: jest.fn(() => false),
        hasElevatedSession: jest.fn(() => false),
      });

      render(
        <TestRouterWithAllProviders>
          <Header
            onHomeClick={() => {}}
            onAboutClick={() => {}}
            onLoginRegisterClick={() => {}}
          />
        </TestRouterWithAllProviders>
      );

      await waitFor(() => {
        expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      });
    });

    it('toggles theme when theme button is clicked', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: jest.fn(() => false),
        hasElevatedSession: jest.fn(() => false),
      });

      render(
        <TestRouterWithAllProviders>
          <Header
            onHomeClick={() => {}}
            onAboutClick={() => {}}
            onLoginRegisterClick={() => {}}
          />
        </TestRouterWithAllProviders>
      );

      await waitFor(() => {
        const themeButton = screen.getByLabelText('Toggle theme');
        expect(themeButton).toBeInTheDocument();
        fireEvent.click(themeButton);
        // Theme toggle is tested via ThemeContext
      });
    });
  });
});
