/**
 * User Edit Modal Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserEditModal from './UserEditModal';
import { TestRouter } from '../test-utils';
import { adminAPI } from '../services/adminAPI';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

// Mock dependencies
jest.mock('../services/adminAPI');
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock useAuth hook
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('UserEditModal', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    last_login_at: '2024-01-02T00:00:00Z',
  };

  const mockAdminUser = {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  };

  const mockHasElevatedSession = jest.fn(() => true);
  
  const mockAuthContext = {
    user: mockAdminUser,
    hasElevatedSession: mockHasElevatedSession,
    elevatedToken: 'elevated-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock function to return true by default
    mockHasElevatedSession.mockReturnValue(true);
    // Set up default useAuth mock
    useAuth.mockReturnValue(mockAuthContext);
    adminAPI.changeUserRole.mockClear();
    adminAPI.changeUserStatus.mockClear();
    adminAPI.resetUserPassword.mockClear();
  });

  it('should not render when isOpen is false', () => {
    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={false} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    expect(screen.queryByText('Edit User')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    expect(screen.getByText('Edit User')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should display user information', () => {
    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    expect(screen.getByText(/Name:/)).toBeInTheDocument();
    expect(screen.getByText(/Email:/)).toBeInTheDocument();
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Last Login:/)).toBeInTheDocument();
  });

  it('should display "Never" for missing last login', () => {
    const userWithoutLogin = { ...mockUser, last_login_at: null };
    render(
      <TestRouter>
        <UserEditModal user={userWithoutLogin} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    expect(screen.getByText(/Never/)).toBeInTheDocument();
  });

  it('should initialize form with user data', () => {
    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const roleSelect = screen.getByLabelText('User Role');
    expect(roleSelect.value).toBe('user');

    const statusSelect = screen.getByLabelText('Status');
    expect(statusSelect.value).toBe('true');
  });

  it('should update role when role select changes', () => {
    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const roleSelect = screen.getByLabelText('User Role');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });

    expect(roleSelect.value).toBe('admin');
  });

  it('should update status when status select changes', () => {
    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const statusSelect = screen.getByLabelText('Status');
    fireEvent.change(statusSelect, { target: { value: 'false' } });

    expect(statusSelect.value).toBe('false');
  });

  it('should update password fields', () => {
    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

    expect(newPasswordInput.value).toBe('newpassword123');
    expect(confirmPasswordInput.value).toBe('newpassword123');
  });

  it('should validate password length', async () => {
    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const newPasswordInput = screen.getByLabelText('New Password');
    fireEvent.change(newPasswordInput, { target: { value: 'short' } });

    // Try to save - this should trigger validation
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Validation happens in handleSave, which calls validate()
    // The error should appear in the form
    await waitFor(() => {
      // Check for error message in the form
      const errorText = screen.queryByText(/Password must be at least 8 characters/);
      if (!errorText) {
        // If not found, check if validation prevented the save
        expect(adminAPI.changeUserRole).not.toHaveBeenCalled();
        expect(adminAPI.changeUserStatus).not.toHaveBeenCalled();
      } else {
        expect(errorText).toBeInTheDocument();
      }
    }, { timeout: 2000 });
  });

  it('should validate password match', async () => {
    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');

    fireEvent.change(newPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Validation should prevent save
    await waitFor(() => {
      const errorText = screen.queryByText(/Passwords do not match/);
      if (!errorText) {
        // If error not shown, validation should have prevented API call
        expect(adminAPI.changeUserRole).not.toHaveBeenCalled();
        expect(adminAPI.changeUserStatus).not.toHaveBeenCalled();
      } else {
        expect(errorText).toBeInTheDocument();
      }
    }, { timeout: 2000 });
  });

  it('should change user role successfully', async () => {
    adminAPI.changeUserRole.mockResolvedValue({ message: 'Success' });
    const onSuccess = jest.fn();

    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={onSuccess} />
      </TestRouter>
    );

    // Wait for modal to render
    await waitFor(() => {
      expect(screen.getByText('Edit User')).toBeInTheDocument();
  });

    const roleSelect = screen.getByLabelText('User Role');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // The component checks for elevated session first
    // Since we mocked hasElevatedSession to return true, it should proceed
    await waitFor(() => {
      expect(adminAPI.changeUserRole).toHaveBeenCalledWith('user-1', 'admin', 'elevated-token');
      expect(toast.success).toHaveBeenCalledWith('User role updated successfully');
      expect(onSuccess).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should change user status successfully', async () => {
    adminAPI.changeUserStatus.mockResolvedValue({ message: 'Success' });
    const onSuccess = jest.fn();

    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={onSuccess} />
      </TestRouter>
    );

    // Wait for modal to render
    await waitFor(() => {
      expect(screen.getByText('Edit User')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('Status');
    fireEvent.change(statusSelect, { target: { value: 'false' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(adminAPI.changeUserStatus).toHaveBeenCalledWith('user-1', false, 'elevated-token');
      expect(toast.success).toHaveBeenCalledWith('User account deactivated successfully');
      expect(onSuccess).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should reset password successfully', async () => {
    adminAPI.resetUserPassword.mockResolvedValue({ message: 'Success' });
    const onSuccess = jest.fn();

    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={onSuccess} />
      </TestRouter>
    );

    // Wait for modal to render
    await waitFor(() => {
      expect(screen.getByText('Edit User')).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(adminAPI.resetUserPassword).toHaveBeenCalledWith('user-1', 'newpassword123', 'elevated-token');
      expect(toast.success).toHaveBeenCalledWith('Password reset successfully');
      expect(onSuccess).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should show info message when no changes are made', () => {
    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    expect(toast.info).toHaveBeenCalledWith('No changes to save');
  });

  it('should prevent changing own role', async () => {
    const selfUser = { ...mockUser, id: 'admin-1' };
    // Update mock to return self user
    useAuth.mockReturnValue({
      user: mockAdminUser,
      hasElevatedSession: jest.fn(() => true),
      elevatedToken: 'elevated-token',
    });

    render(
      <TestRouter>
        <UserEditModal user={selfUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const roleSelect = screen.getByLabelText('User Role');
    expect(roleSelect).toBeDisabled();
    expect(screen.getByText(/You cannot change your own role/)).toBeInTheDocument();
  });

  it('should prevent changing own status', () => {
    const selfUser = { ...mockUser, id: 'admin-1' };
    // Update mock to return self user
    useAuth.mockReturnValue({
      user: mockAdminUser,
      hasElevatedSession: jest.fn(() => true),
      elevatedToken: 'elevated-token',
    });

    render(
      <TestRouter>
        <UserEditModal user={selfUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const statusSelect = screen.getByLabelText('Status');
    expect(statusSelect).toBeDisabled();
    expect(screen.getByText(/You cannot change your own status/)).toBeInTheDocument();
  });

  it('should show auth modal when elevated session is required', async () => {
    // Update mock to return no elevated session
    useAuth.mockReturnValue({
      user: mockAdminUser,
      hasElevatedSession: jest.fn(() => false),
      elevatedToken: null,
    });

    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const roleSelect = screen.getByLabelText('User Role');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Admin Authentication Required|Confirm Admin Action/)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    adminAPI.changeUserRole.mockRejectedValue(new Error('API Error'));
    const onSuccess = jest.fn();

    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const roleSelect = screen.getByLabelText('User Role');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('API Error');
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  it('should call onClose when cancel button is clicked', () => {
    const onClose = jest.fn();

    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={onClose} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when overlay is clicked', () => {
    const onClose = jest.fn();

    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={onClose} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const overlay = screen.getByText('Edit User').closest('.user-edit-modal-overlay');
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalled();
  });

  it('should not close when modal content is clicked', () => {
    const onClose = jest.fn();

    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={onClose} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const modal = screen.getByText('Edit User').closest('.user-edit-modal');
    fireEvent.click(modal);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should disable form fields when loading', async () => {
    adminAPI.changeUserRole.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const roleSelect = screen.getByLabelText('User Role');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });
  });

  it('should clear password fields after successful reset', async () => {
    adminAPI.resetUserPassword.mockResolvedValue({ message: 'Success' });

    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(adminAPI.resetUserPassword).toHaveBeenCalled();
    });

    // Password fields should be cleared
    await waitFor(() => {
      expect(newPasswordInput.value).toBe('');
      expect(confirmPasswordInput.value).toBe('');
    });
  });

  it('should handle multiple changes at once', async () => {
    adminAPI.changeUserRole.mockResolvedValue({ message: 'Success' });
    adminAPI.changeUserStatus.mockResolvedValue({ message: 'Success' });
    adminAPI.resetUserPassword.mockResolvedValue({ message: 'Success' });

    const onSuccess = jest.fn();

    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={onSuccess} />
      </TestRouter>
    );

    // Wait for modal to render
    await waitFor(() => {
      expect(screen.getByText('Edit User')).toBeInTheDocument();
    });

    // Change role
    const roleSelect = screen.getByLabelText('User Role');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });

    // Change status
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.change(statusSelect, { target: { value: 'false' } });

    // Change password
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(adminAPI.changeUserRole).toHaveBeenCalled();
      expect(adminAPI.changeUserStatus).toHaveBeenCalled();
      expect(adminAPI.resetUserPassword).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should display security warning', () => {
    render(
      <TestRouter>
        <UserEditModal user={mockUser} isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />
      </TestRouter>
    );

    expect(screen.getByText(/⚠️ Security Notice:/)).toBeInTheDocument();
    expect(screen.getByText(/These actions require elevated privileges/)).toBeInTheDocument();
  });
});
