/**
 * Admin Authentication Modal
 * 
 * Prompts admin to re-enter password for elevated session
 * Used before sensitive operations like changing roles or resetting passwords
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import './AdminAuthModal.css';

const AdminAuthModal = ({ isOpen, onClose, onSuccess, title = 'Admin Authentication Required' }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { requestElevatedSession } = useAuth();

  // Keyboard shortcut to auto-fill admin password (Ctrl/Cmd+Shift+A)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Check for Ctrl+Shift+A (Windows/Linux) or Cmd+Shift+A (Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        const adminPassword = process.env.REACT_APP_ADMIN_PASSWORD || 'Admin123!';
        setPassword(adminPassword);
        toast.info('Admin password auto-filled');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await requestElevatedSession(password);
      if (result.success) {
        setPassword('');
        onSuccess(result.token); // Pass the token to the callback
        onClose();
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="admin-auth-modal-overlay" onClick={handleClose}>
      <div className="admin-auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-auth-modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="admin-auth-modal-body">
          <p className="admin-auth-message">
            This action requires elevated privileges. Please enter your admin password to continue.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="admin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex="-1"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="admin-auth-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !password}
              >
                {loading ? 'Verifying...' : 'Authenticate'}
              </button>
            </div>
          </form>

          <p className="admin-auth-note">
            <strong>Note:</strong> Elevated session will expire after 15 minutes of inactivity.
          </p>

          <div className="admin-auth-shortcut-hint">
            <strong>Dev tip:</strong> Press <kbd>Ctrl+Shift+A</kbd> (or <kbd>Cmd+Shift+A</kbd> on Mac) to auto-fill admin password
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthModal;

