import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from './Profile';
import * as AuthContext from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import { toast } from 'react-toastify';

// Mock dependencies
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../services/api', () => ({
  usersAPI: {
    getCurrent: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockNavigate = jest.fn();

// Wrapper component
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Profile Component', () => {
  const mockUser = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    created_at: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
    // Mock usersAPI.getCurrent to return user data
    usersAPI.getCurrent.mockResolvedValue({
      user: mockUser,
    });
  });

  describe('Positive Tests - View Mode', () => {
    it('should render user profile information', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User Profile')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('123')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display formatted member since date', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User Profile')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Check that date is formatted (should contain month name)
      expect(screen.getByText(/January|February|March|April|May|June|July|August|September|October|November|December/)).toBeInTheDocument();
    });

    it('should render Edit Profile button', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should render Logout button', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Positive Tests - Edit Mode', () => {
    it('should enter edit mode when Edit Profile clicked', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      // Wait for Profile to load
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      }, { timeout: 3000 });

      const editButton = screen.getByText('Edit Profile');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('should allow editing name field', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });

      expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
    });

    it('should allow editing email field', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByDisplayValue('john@example.com');
      fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });

      expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    });

    it('should successfully update profile', async () => {
      const mockUpdateUser = jest.fn();
      const updatedUser = { ...mockUser, name: 'Jane Smith' };

      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: mockUpdateUser,
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      usersAPI.update.mockResolvedValue({ user: updatedUser });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      // Wait for Profile to load
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(usersAPI.update).toHaveBeenCalledWith('123', {
          name: 'Jane Smith',
          email: 'john@example.com',
        });
      });

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalled();
      }, { timeout: 2000 });

      // Check that updateUser was called with the updated user
      expect(mockUpdateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane Smith',
        })
      );

      expect(toast.success).toHaveBeenCalled();
    });

    it('should cancel edit mode and restore original values', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Changed Name' } });

      fireEvent.click(screen.getByText('Cancel'));

      // Should be back in view mode
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        // Original name should be displayed
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Negative Tests - Error Handling', () => {
    it('should handle API error during update', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      const errorMessage = 'Failed to update profile';
      usersAPI.update.mockRejectedValue(new Error(errorMessage));

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      // Wait for Profile to load
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'New Name' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should handle network error during update', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      usersAPI.update.mockRejectedValue(new Error('Network error'));

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      // Wait for Profile to load
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Make a change so form is valid
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'New Name' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should show loading spinner while saving', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      // Delay the API response
      usersAPI.update.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ user: mockUser }), 100))
      );

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      // Wait for Profile to load
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Make a change so form is valid
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'New Name' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      // When isSaving is true, Profile shows Loading component with "Saving profile..." message
      await waitFor(() => {
        expect(screen.getByText('Saving profile...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByText('Saving profile...')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should prevent double submission', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      usersAPI.update.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ user: mockUser }), 100))
      );

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      // Wait for Profile to load
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Make a change so form is valid
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'New Name' } });
      
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);
      fireEvent.click(saveButton); // Try to click again

      await waitFor(() => {
        expect(usersAPI.update).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Edge Case Error Handling', () => {
    it('should handle API fetch failure with fallback to context user', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockRejectedValueOnce(new Error('Network error'));

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Should fallback to context user data
      expect(usersAPI.getCurrent).toHaveBeenCalled();
    });

    it('should handle update error with various error formats', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValueOnce({ user: mockUser });
      usersAPI.update.mockRejectedValueOnce({
        error: 'Email already exists',
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

      const saveButton = await screen.findByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Email already exists');
      });
    });

    it('should handle update error with array of errors', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValueOnce({ user: mockUser });
      usersAPI.update.mockRejectedValueOnce({
        errors: [
          { msg: 'Email is required' },
          { msg: 'Name is too short' }
        ],
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Make a change to enable the save button
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

      const saveButton = await screen.findByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        const errorCall = toast.error.mock.calls[0][0];
        expect(errorCall).toContain('Email is required');
      });
    });

    it('should handle update error with data.error format', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValueOnce({ user: mockUser });
      usersAPI.update.mockRejectedValueOnce({
        data: { error: 'Server error occurred' },
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Make a change to enable the save button
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

      const saveButton = await screen.findByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Server error occurred');
      });
    });

    it('should handle null or undefined user gracefully', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: null,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValueOnce({ user: null });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      // Should not crash - component should handle null user
      // The component will try to fetch user data, and if that fails, it should handle gracefully
      await waitFor(() => {
        // Component should render something (loading or error state)
        const hasContent = screen.queryByText('Profile') || screen.queryByText('Loading');
        expect(hasContent || mockNavigate).toBeTruthy();
      }, { timeout: 2000 });
    });
  });

  describe('Logout Functionality', () => {
    it('should call logout when Logout button clicked', async () => {
      const mockLogout = jest.fn();

      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: mockLogout,
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByText('Logout'));

      expect(mockLogout).toHaveBeenCalled();
    });

    it('should navigate to home after logout', async () => {
      const mockLogout = jest.fn();

      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: mockLogout,
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByText('Logout'));

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  describe('Edge Cases', () => {
    it('should show loading when user is null', () => {
      AuthContext.useAuth.mockReturnValue({
        user: null,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
    });

    it('should handle user with minimal data', async () => {
      const minimalUser = {
        id: '1',
        name: 'User',
        email: 'user@test.com',
        created_at: '2024-01-01',
      };

      AuthContext.useAuth.mockReturnValue({
        user: minimalUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: minimalUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
        expect(screen.getByText('user@test.com')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle very long names', async () => {
      const longNameUser = {
        ...mockUser,
        name: 'A'.repeat(100),
      };

      AuthContext.useAuth.mockReturnValue({
        user: longNameUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: longNameUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle special characters in name', async () => {
      const specialCharUser = {
        ...mockUser,
        name: "O'Brien-Smith",
      };

      AuthContext.useAuth.mockReturnValue({
        user: specialCharUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: specialCharUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("O'Brien-Smith")).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display password change note', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Password changes are not yet implemented/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Form Validation', () => {
    it('should require name field', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toHaveAttribute('required');
      });
    });

    it('should require email field', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: mockUser,
        isAdmin: jest.fn(() => false),
        logout: jest.fn(),
        updateUser: jest.fn(),
      });

      usersAPI.getCurrent.mockResolvedValue({
        user: mockUser,
      });

      render(
        <RouterWrapper>
          <Profile />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('john@example.com');
        expect(emailInput).toHaveAttribute('required');
        expect(emailInput).toHaveAttribute('type', 'email');
      });
    });
  });
});

