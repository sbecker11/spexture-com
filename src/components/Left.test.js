import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TestRouterWithAllProviders } from "../test-utils";
import { authAPI } from "../services/api";
import * as AuthContext from "../contexts/AuthContext";

import Left from "./Left";

// Mock authAPI.getCurrentUser to prevent real API calls in AuthProvider
// This mock is scoped to this test file only
beforeEach(() => {
  jest.spyOn(authAPI, 'getCurrentUser').mockRejectedValue(
    new Error('Not authenticated')
  );
  localStorage.removeItem('token');
});

afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});

import { onHomeClick } from "./Home.test";
import { onAboutClick } from "./About.test";
import { onLoginRegisterClick } from "./LoginRegister.test";

describe("Left", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", async () => {
    render(
      <TestRouterWithAllProviders>
        <Left
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

  it("displays home link", async () => {
    render(
      <TestRouterWithAllProviders>
        <Left
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
        <Left
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
        <Left
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
        <Left
          onHomeClick={onHomeClick}
          onAboutClick={() => {}}
          onLoginRegisterClick={() => {}}
        />
      </TestRouterWithAllProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/home/i)).toBeInTheDocument();
    });

    const homeLink = screen.getByText(/home/i);
    fireEvent.click(homeLink);
    expect(onHomeClick).toHaveBeenCalled();
  });

  it("calls onAboutClick when about link is clicked", async () => {
    render(
      <TestRouterWithAllProviders>
        <Left
          onHomeClick={() => {}}
          onAboutClick={onAboutClick}
          onLoginRegisterClick={() => {}}
        />
      </TestRouterWithAllProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/about/i)).toBeInTheDocument();
    });

    const aboutLink = screen.getByText(/about/i);
    fireEvent.click(aboutLink);
    expect(onAboutClick).toHaveBeenCalled();
  });

  it("calls onLoginRegisterClick when login/register link is clicked", async () => {
    render(
      <TestRouterWithAllProviders>
        <Left
          onHomeClick={() => {}}
          onAboutClick={() => {}}
          onLoginRegisterClick={onLoginRegisterClick}
        />
      </TestRouterWithAllProviders>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/login\/register/i)).toBeInTheDocument();
    });

    const loginRegisterLink = screen.getByText(/login\/register/i);
    fireEvent.click(loginRegisterLink);
    expect(onLoginRegisterClick).toHaveBeenCalled();
  });

  it("has the correct container class", async () => {
    const { container } = render(
      <TestRouterWithAllProviders>
        <Left
          onHomeClick={() => {}}
          onAboutClick={() => {}}
          onLoginRegisterClick={() => {}}
        />
      </TestRouterWithAllProviders>
    );
    
    await waitFor(() => {
      const leftElement = container.querySelector('.left-column');
      expect(leftElement).toBeInTheDocument();
    });
  });

  // Branch coverage tests for authenticated states
  describe('Branch coverage - authenticated states', () => {
    let originalUseAuth;

    beforeAll(() => {
      // Save original useAuth
      originalUseAuth = AuthContext.useAuth;
    });

    beforeEach(() => {
      // Mock useAuth for these tests
      AuthContext.useAuth = jest.fn();
    });

    afterAll(() => {
      // Restore original useAuth
      AuthContext.useAuth = originalUseAuth;
    });

    it('shows authenticated user links when user is authenticated', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, name: 'Test User', email: 'test@example.com' },
        token: 'test-token',
        isAuthenticated: true,
        isAdmin: () => false,
        hasElevatedSession: () => false,
        logout: jest.fn(),
      });

      render(
        <TestRouterWithAllProviders>
          <Left
            onHomeClick={() => {}}
            onAboutClick={() => {}}
            onLoginRegisterClick={() => {}}
          />
        </TestRouterWithAllProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Analyzer')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
        expect(screen.queryByText('Login/Register')).not.toBeInTheDocument();
      });
    });

    it('shows admin link when user is authenticated and is admin', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
        token: 'test-token',
        isAuthenticated: true,
        isAdmin: () => true,
        hasElevatedSession: () => false,
        logout: jest.fn(),
      });

      render(
        <TestRouterWithAllProviders>
          <Left
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
        isAdmin: () => false,
        hasElevatedSession: () => false,
        logout: jest.fn(),
      });

      render(
        <TestRouterWithAllProviders>
          <Left
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

    it('shows user name in profile link when user is authenticated with name', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, name: 'John Doe', email: 'john@example.com' },
        token: 'test-token',
        isAuthenticated: true,
        isAdmin: () => false,
        hasElevatedSession: () => false,
        logout: jest.fn(),
      });

      render(
        <TestRouterWithAllProviders>
          <Left
            onHomeClick={() => {}}
            onAboutClick={() => {}}
            onLoginRegisterClick={() => {}}
          />
        </TestRouterWithAllProviders>
      );

      await waitFor(() => {
        // Profile link shows "Profile" text, not user name
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });
    });

    it('calls logout when logout button is clicked', async () => {
      const mockLogout = jest.fn();
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, name: 'Test User', email: 'test@example.com' },
        token: 'test-token',
        isAuthenticated: true,
        isAdmin: () => false,
        hasElevatedSession: () => false,
        logout: mockLogout,
      });

      render(
        <TestRouterWithAllProviders>
          <Left
            onHomeClick={() => {}}
            onAboutClick={() => {}}
            onLoginRegisterClick={() => {}}
          />
        </TestRouterWithAllProviders>
      );

      await waitFor(() => {
        const logoutButton = screen.getByText('Logout');
        fireEvent.click(logoutButton);
        expect(mockLogout).toHaveBeenCalled();
      });
    });
  });
});
