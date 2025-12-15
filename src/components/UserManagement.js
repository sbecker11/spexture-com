/**
 * User Management Component
 * 
 * List, filter, sort, and manage users
 * GENERIC COMPONENT - No application-specific logic
 */

import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/adminAPI';
import AdminAuthModal from './AdminAuthModal';
import UserEditModal from './UserEditModal';
import { toast } from 'react-toastify';
import PageContainer from './PageContainer';
import './UserManagement.css';

const UserManagement = () => {
  const { isAdmin, hasElevatedSession, login, user: currentUser, elevatedToken } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    role: '',
    is_active: '',
    search: '',
  });

  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  // Load users
  const loadUsers = React.useCallback(async () => {
    // Don't load if user is not admin
    if (!isAdmin()) {
      return;
    }

    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const data = await adminAPI.listUsers(params);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Extract error message from various error formats
      let errorMessage = 'Failed to load users';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Check if this is a network error or API error
      if (errorMessage.includes('Network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        toast.error('Cannot connect to server. Please check if the server is running on port 3011.');
      } else {
        toast.error(`Failed to list users: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, filters, isAdmin]);

  useEffect(() => {
    // Only load if user is admin
    if (isAdmin()) {
      loadUsers();
    }
  }, [loadUsers, isAdmin]);

  // Redirect non-admins (must be after all hooks)
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle sort change
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle "Login As" (impersonate user)
  const handleLoginAs = async (targetUser, providedElevatedToken = null) => {
    try {
      // Prevent logging in as self
      if (targetUser.id === currentUser?.id) {
        toast.error('Cannot impersonate yourself');
        return;
      }

      // Show loading state
      toast.info(`Switching to ${targetUser.name}...`);

      // Use provided token (from fresh auth) or fall back to state
      const tokenToUse = providedElevatedToken || elevatedToken;

      // Call impersonate API
      const response = await adminAPI.impersonateUser(targetUser.id, tokenToUse);
      console.log('Impersonation response:', response);

      // Store original admin info and token for "switch back" feature
      const currentToken = localStorage.getItem('token');
      localStorage.setItem('originalAdmin', JSON.stringify({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        token: currentToken
      }));

      // Switch to the target user's session (force synchronous update)
      flushSync(() => {
        login(response.user, response.token);
      });

      // Show success message
      toast.success(response.message || `Now logged in as ${targetUser.name}`);

      // Delay navigation to allow state to propagate
      setTimeout(() => {
        console.log('Navigating to profile...');
        navigate('/profile');
      }, 100);
    } catch (error) {
      console.error('Failed to impersonate user:', error);
      toast.error(error.message || 'Failed to impersonate user');
    }
  };

  // Handle action requiring elevated session
  const handleSensitiveAction = (action, user) => {
    if (hasElevatedSession()) {
      // Already have elevated session, proceed
      action(user);
    } else {
      // Need to authenticate
      setPendingAction(() => (token) => action(user, token));
      setSelectedUser(user);
      setShowAuthModal(true);
    }
  };

  // After elevated auth success
  const handleAuthSuccess = (elevatedToken) => {
    if (pendingAction) {
      pendingAction(elevatedToken);
      setPendingAction(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get role badge class
  const getRoleBadgeClass = (role) => {
    return role === 'admin' ? 'badge-admin' : 'badge-user';
  };

  // Get status badge class
  const getStatusBadgeClass = (isActive) => {
    return isActive ? 'badge-active' : 'badge-inactive';
  };

  return (
    <PageContainer>
      <div className="user-management-header">
        <h1>User Management</h1>
        <p>Manage user accounts, roles, and permissions</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="search">Search</label>
          <input
            type="text"
            id="search"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={filters.is_active}
            onChange={(e) => handleFilterChange('is_active', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="limit">Items Per Page</label>
          <select
            id="limit"
            value={pagination.limit}
            onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="no-users">No users found</div>
      ) : (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Name {sortBy === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('email')} className="sortable">
                    Email {sortBy === 'email' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('role')} className="sortable">
                    Role {sortBy === 'role' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('is_active')} className="sortable">
                    Status {sortBy === 'is_active' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('last_login_at')} className="sortable">
                    Last Login {sortBy === 'last_login_at' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('created_at')} className="sortable">
                    Created {sortBy === 'created_at' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                  <th>Impersonate</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(user.is_active)}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{formatDate(user.last_login_at)}</td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <button
                        className="btn-action btn-edit"
                        onClick={() => handleEditUser(user)}
                        title="Edit user"
                      >
                        ✏️
                      </button>
                    </td>
                    <td>
                      {user.id !== currentUser?.id && (
                        <button
                          className="btn-action btn-impersonate"
                          onClick={() => handleSensitiveAction(handleLoginAs, user)}
                          title={`Login as ${user.name}`}
                          disabled={!user.is_active}
                        >
                          LOGIN AS
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount} users
            </div>
            <div className="pagination-controls">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-pagination"
              >
                ← Previous
              </button>
              <span className="pagination-current">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="btn-pagination"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <AdminAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {showEditModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            loadUsers();
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </PageContainer>
  );
};

export default UserManagement;

