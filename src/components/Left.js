import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Import Link, useNavigate, and useLocation from react-router-dom
import { useAuth } from '../contexts/AuthContext';

function Left({ onHomeClick, onAboutClick, onLoginRegisterClick }) {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only show dev tools in development
  const isDevelopment = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '';

  // Determine active route
  const isHomeActive = location.pathname === '/' || location.pathname === '/home';
  const isAboutActive = location.pathname === '/about';
  const isDevToolsActive = location.pathname === '/dev-tools';
  const isLoginRegisterActive = location.pathname === '/login-register';
  const isAnalyzerActive = location.pathname === '/analyzer';
  const isProfileActive = location.pathname === '/profile';
  const isAdminActive = location.pathname.startsWith('/admin');

  return (
    <div className="left-column">
      <ul>
        {/* Use Link components for navigation */}
        <li>
          <Link
            to="/"
            onClick={onHomeClick}
            className={isHomeActive ? 'active' : ''}
          >
            Home
          </Link>
        </li>
        <li>
          <Link 
            to="/about" 
            onClick={onAboutClick}
            className={isAboutActive ? 'active' : ''}
          >
            About
          </Link>
        </li>
        {!isAuthenticated && (
          <li>
            <Link 
              to="/login-register" 
              onClick={onLoginRegisterClick}
              className={isLoginRegisterActive ? 'active' : ''}
            >
              Login/Register
            </Link>
          </li>
        )}
        {isDevelopment && (
          <li>
            <Link
              to="/dev-tools"
              className={isDevToolsActive ? 'active' : ''}
            >
              Dev Tools
            </Link>
          </li>
        )}
        {isAuthenticated && (
          <>
            <li>
              <Link
                to="/analyzer"
                className={isAnalyzerActive ? 'active' : ''}
              >
                Analyzer
              </Link>
            </li>
            {isAdmin() && (
              <li>
                <Link
                  to="/admin"
                  className={isAdminActive ? 'active' : ''}
                >
                  Admin
                </Link>
              </li>
            )}
            <li>
              <Link
                to="/profile"
                className={isProfileActive ? 'active' : ''}
              >
                Profile
              </Link>
            </li>
            <li>
              <button 
                onClick={() => {
                  // Navigate to home page first, then logout
                  // This prevents ProtectedRoute from redirecting to login-register
                  navigate('/', { replace: true });
                  logout();
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--link-color)', 
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  padding: 0,
                  width: '100%',
                  textAlign: 'left'
                }}
              >
Logout
              </button>
            </li>
          </>
        )}
      </ul>
    </div>
  );
}

export default Left;
