/**
 * User Edit Modal
 * 
 * Edit user details (role, status, password)
 * GENERIC COMPONENT - No application-specific logic
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/adminAPI';
import AdminAuthModal from './AdminAuthModal';
import { toast } from 'react-toastify';
import './UserEditModal.css';

const UserEditModal = ({ user, isOpen, onClose, onSuccess }) => {
  const { user: currentUser, hasElevatedSession, elevatedToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    role: user.role,
    is_active: user.is_active,
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  // Check if editing self
  const isEditingSelf = currentUser?.id === user.id;

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle sensitive action (requires elevated session)
  const handleSensitiveAction = async (action) => {
    if (hasElevatedSession()) {
      // Already have elevated session
      await action();
    } else {
      // Need to authenticate
      setPendingAction(() => action);
      setShowAuthModal(true);
    }
  };

  // After elevated auth success
  const handleAuthSuccess = async () => {
    if (pendingAction) {
      await pendingAction();
      setPendingAction(null);
    }
  };

  // Change role
  const changeRole = async () => {
    if (isEditingSelf) {
      toast.error('Cannot change your own role');
      return;
    }

    setLoading(true);
    try {
      await adminAPI.changeUserRole(user.id, formData.role, elevatedToken);
      toast.success('User role updated successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  // Change status
  const changeStatus = async () => {
    if (isEditingSelf) {
      toast.error('Cannot change your own account status');
      return;
    }

    setLoading(true);
    try {
      await adminAPI.changeUserStatus(user.id, formData.is_active, elevatedToken);
      toast.success(`User account ${formData.is_active ? 'activated' : 'deactivated'} successfully`);
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await adminAPI.resetUserPassword(user.id, formData.newPassword, elevatedToken);
      toast.success('Password reset successfully');
      setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    // Check what changed
    const roleChanged = formData.role !== user.role;
    const statusChanged = formData.is_active !== user.is_active;
    const passwordChanged = formData.newPassword.trim() !== '';

    if (!roleChanged && !statusChanged && !passwordChanged) {
      toast.info('No changes to save');
      return;
    }

    // All changes require elevated session
    await handleSensitiveAction(async () => {
      if (roleChanged) await changeRole();
      if (statusChanged) await changeStatus();
      if (passwordChanged) await resetPassword();
    });
  };

  return (
    <>
      <div className="user-edit-modal-overlay" onClick={onClose}>
        <div className="user-edit-modal" onClick={(e) => e.stopPropagation()}>
          <div className="user-edit-modal-header">
            <h2>Edit User</h2>
            <button className="close-button" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>

          <div className="user-edit-modal-body">
            {/* User Info */}
            <div className="user-info-section">
              <div className="user-info-item">
                <strong>Name:</strong> {user.name}
              </div>
              <div className="user-info-item">
                <strong>Email:</strong> {user.email}
              </div>
              <div className="user-info-item">
                <strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}
              </div>
              <div className="user-info-item">
                <strong>Last Login:</strong>{' '}
                {user.last_login_at
                  ? new Date(user.last_login_at).toLocaleDateString()
                  : 'Never'}
              </div>
            </div>

            {/* Role */}
            <div className="form-section">
              <h3>Role</h3>
              <div className="form-group">
                <label htmlFor="role">User Role</label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  disabled={loading || isEditingSelf}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {isEditingSelf && (
                  <p className="form-note">You cannot change your own role</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="form-section">
              <h3>Account Status</h3>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                  disabled={loading || isEditingSelf}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                {isEditingSelf && (
                  <p className="form-note">You cannot change your own status</p>
                )}
              </div>
            </div>

            {/* Password Reset */}
            <div className="form-section">
              <h3>Reset Password</h3>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password (min 8 characters)"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    title={showNewPassword ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="form-error">{errors.newPassword}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="form-error">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Warning */}
            <div className="warning-box">
              <strong>⚠️ Security Notice:</strong> These actions require elevated privileges. 
              You will be prompted to re-enter your password if your elevated session has expired.
            </div>
          </div>

          <div className="user-edit-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Auth Modal */}
      <AdminAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        title="Confirm Admin Action"
      />
    </>
  );
};

export default UserEditModal;

