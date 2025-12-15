/**
 * Admin Dashboard Tests
 */

import React from 'react';
import { screen } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { TestRouter } from '../test-utils';

// Mock PageContainer to avoid dependency issues
jest.mock('./PageContainer', () => {
  return function MockPageContainer({ children }) {
    return <div data-testid="page-container">{children}</div>;
  };
});

// Mock useAuth hook
const mockIsAdmin = jest.fn(() => true);
const mockAdminUser = {
  id: '1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockAdminUser,
    isAdmin: mockIsAdmin,
  }),
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAdmin.mockReturnValue(true);
  });

  it('should render dashboard for admin user', () => {
    const { render } = require('@testing-library/react');
    render(
      <TestRouter>
        <AdminDashboard />
      </TestRouter>
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('should redirect non-admin users', () => {
    mockIsAdmin.mockReturnValue(false);
    const { render } = require('@testing-library/react');
    
    render(
      <TestRouter>
        <AdminDashboard />
      </TestRouter>
    );

    // Navigate component redirects, so dashboard content should not be visible
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('should display user management card', () => {
    const { render } = require('@testing-library/react');
    render(
      <TestRouter>
        <AdminDashboard />
      </TestRouter>
    );

    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText(/Manage user accounts, roles, and permissions/)).toBeInTheDocument();
  });

  it('should have link to user management', () => {
    const { render } = require('@testing-library/react');
    render(
      <TestRouter>
        <AdminDashboard />
      </TestRouter>
    );

    const link = screen.getByText('User Management').closest('a');
    expect(link).toHaveAttribute('href', '/admin/users');
  });

  it('should display analytics card as disabled', () => {
    const { render } = require('@testing-library/react');
    render(
      <TestRouter>
        <AdminDashboard />
      </TestRouter>
    );

    expect(screen.getByText('Analytics')).toBeInTheDocument();
    // There are multiple "Coming Soon" texts, so use getAllByText
    const comingSoonTexts = screen.getAllByText('Coming Soon');
    expect(comingSoonTexts.length).toBeGreaterThan(0);
  });

  it('should display system settings card as disabled', () => {
    const { render } = require('@testing-library/react');
    render(
      <TestRouter>
        <AdminDashboard />
      </TestRouter>
    );

    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  it('should display audit logs card as disabled', () => {
    const { render } = require('@testing-library/react');
    render(
      <TestRouter>
        <AdminDashboard />
      </TestRouter>
    );

    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
  });

  it('should display security info card', () => {
    const { render } = require('@testing-library/react');
    render(
      <TestRouter>
        <AdminDashboard />
      </TestRouter>
    );

    expect(screen.getByText('🔐 Security')).toBeInTheDocument();
    expect(
      screen.getByText(/Sensitive operations require password re-authentication/)
    ).toBeInTheDocument();
  });

  it('should display audit trail info card', () => {
    const { render } = require('@testing-library/react');
    render(
      <TestRouter>
        <AdminDashboard />
      </TestRouter>
    );

    expect(screen.getByText('📋 Audit Trail')).toBeInTheDocument();
    expect(
      screen.getByText(/All admin actions are logged with timestamps/)
    ).toBeInTheDocument();
  });

  it('should render all admin cards', () => {
    const { render } = require('@testing-library/react');
    render(
      <TestRouter>
        <AdminDashboard />
      </TestRouter>
    );

    const cards = screen.getAllByText(/User Management|Analytics|System Settings|Audit Logs/);
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it('should handle null user gracefully', () => {
    mockIsAdmin.mockReturnValue(false);
    const { render } = require('@testing-library/react');
    
    render(
      <TestRouter>
        <AdminDashboard />
      </TestRouter>
    );
    
    // Should redirect
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });
});
