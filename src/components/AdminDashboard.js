/**
 * Admin Dashboard
 * 
 * Main admin page with overview and navigation to admin features
 * GENERIC COMPONENT - No application-specific logic
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import PageContainer from './PageContainer';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { isAdmin } = useAuth();

  // Redirect non-admins
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageContainer>
      <h1>Admin Dashboard</h1>

      <div className="admin-cards">
        <Link to="/admin/users" className="admin-card">
          <div className="admin-card-icon">👥</div>
          <h2>User Management</h2>
          <p>Manage user accounts, roles, and permissions</p>
          <div className="admin-card-actions">
            <span>View Users →</span>
          </div>
        </Link>

        <Link to="/admin/testing" className="admin-card">
          <div className="admin-card-icon">🧪</div>
          <h2>Testing & Coverage</h2>
          <p>View test results and coverage reports</p>
          <div className="admin-card-actions">
            <span>View Reports →</span>
          </div>
        </Link>

        <div className="admin-card admin-card-disabled">
          <div className="admin-card-icon">📊</div>
          <h2>Analytics</h2>
          <p>View system usage and statistics</p>
          <div className="admin-card-actions">
            <span>Coming Soon</span>
          </div>
        </div>

        <div className="admin-card admin-card-disabled">
          <div className="admin-card-icon">⚙️</div>
          <h2>System Settings</h2>
          <p>Configure application settings</p>
          <div className="admin-card-actions">
            <span>Coming Soon</span>
          </div>
        </div>

        <div className="admin-card admin-card-disabled">
          <div className="admin-card-icon">📝</div>
          <h2>Audit Logs</h2>
          <p>Review system activity and changes</p>
          <div className="admin-card-actions">
            <span>Coming Soon</span>
          </div>
        </div>
      </div>

      <div className="admin-info">
        <div className="info-card">
          <h3>🔐 Security</h3>
          <p>
            Sensitive operations require password re-authentication. 
            Elevated sessions expire after 15 minutes.
          </p>
        </div>

        <div className="info-card">
          <h3>📋 Audit Trail</h3>
          <p>
            All admin actions are logged with timestamps, IP addresses, 
            and user information for security compliance.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default AdminDashboard;

