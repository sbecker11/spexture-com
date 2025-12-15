import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import Link, useLocation, and useNavigate from react-router-dom
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';

function Header({ onHomeClick, onAboutClick, onLoginRegisterClick }) {
  const { isAuthenticated, isAdmin, user, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [originalAdmin, setOriginalAdmin] = useState(null);

  // Check for originalAdmin in localStorage (impersonation)
  useEffect(() => {
    const checkOriginalAdmin = () => {
      const stored = localStorage.getItem('originalAdmin');
      if (stored) {
        try {
          setOriginalAdmin(JSON.parse(stored));
        } catch (error) {
          console.error('Failed to parse originalAdmin:', error);
        }
      } else {
        setOriginalAdmin(null);
      }
    };

    checkOriginalAdmin();
    // Check whenever user changes (login/logout/switch)
  }, [user]);

  // Handle switch back to original admin
  const handleSwitchBack = () => {
    if (!originalAdmin) return;

    try {
      // Restore the original admin session
      const adminUser = {
        id: originalAdmin.id,
        email: originalAdmin.email,
        name: originalAdmin.name,
        role: 'admin' // Admin role
      };

      // Restore admin token and login
      login(adminUser, originalAdmin.token);

      // Clear originalAdmin from localStorage
      localStorage.removeItem('originalAdmin');
      setOriginalAdmin(null);

      toast.success(`Switched back to ${originalAdmin.name}`);
      navigate('/admin/users');
    } catch (error) {
      console.error('Failed to switch back:', error);
      toast.error('Failed to switch back to admin');
    }
  };

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

  // Use theme-aware logo: dark logo for light mode, light logo for dark mode
  const logoSrc = theme === 'light'
    ? `${process.env.PUBLIC_URL}/logo192-dark.png`
    : `${process.env.PUBLIC_URL}/logo192.png`;

  return (
    <header>
      <div className="header-left">
        <img src={logoSrc} alt="Logo" className="header-logo" />
      </div>
      <div className="header-right">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <span className="moon-icon">🌙</span> : '☀️'}
        </button>

        <nav>
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
                  <Link
                    to="/"
                    onClick={(e) => {
                      e.preventDefault();
                      // Check if we're impersonating - if so, switch back to admin
                      const storedOriginalAdmin = localStorage.getItem('originalAdmin');
                      if (storedOriginalAdmin) {
                        // Switch back to original admin instead of logging out
                        handleSwitchBack();
                      } else {
                        // Regular logout
                        logout();
                        navigate('/');
                      }
                    }}
                  >
                    Logout
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* User Profile Section - Far Right */}
        {isAuthenticated && user && (
          <div className="header-user-profile">
            <Link to="/profile" className="header-user-link">
              <div className="header-user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="header-user-info">
                <div className="header-user-name">{user.name || 'User'}</div>
                {/* Show original admin if impersonating */}
                {originalAdmin && user && originalAdmin.id !== user.id && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleSwitchBack();
                    }}
                    className="header-switch-back-link"
                    title={`Switch back to ${originalAdmin.name}`}
                  >
                    ({originalAdmin.name})
                  </button>
                )}
              </div>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
