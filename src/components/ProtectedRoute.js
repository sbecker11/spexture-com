import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication.
 * Redirects to login page if user is not authenticated.
 * Shows loading spinner while checking authentication status.
 * 
 * Usage:
 * <Route path="/analyzer" element={
 *   <ProtectedRoute>
 *     <JDAnalyzer />
 *   </ProtectedRoute>
 * } />
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return <Loading message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login-register" replace />;
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute;

