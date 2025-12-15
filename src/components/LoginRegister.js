import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './LoginRegister.css';
import {
  validationConfig,
  registerSchema,
  loginSchema
} from '../validation';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import Loading from './Loading';

/**
 * Use pre-built schemas from validation repository
 * These schemas are built from validationConfig to ensure consistency
 */
const buildRegisterSchema = () => registerSchema();
const buildLoginSchema = () => loginSchema();

const LoginRegister = () => {
  const navigate = useNavigate();
  const { register: registerUser, login: loginUser, isAuthenticated } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordRuleStatus, setPasswordRuleStatus] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear form data when component mounts or when user is not authenticated
  useEffect(() => {
    // Always clear form when component mounts or when not authenticated
    setProfileData({
      name: '',
      email: '',
      password: '',
    });
    setErrors({});
    setIsFormValid(false);
    setPasswordFocused(false);
    setPasswordRuleStatus({
      minLength: false,
      uppercase: false,
      lowercase: false,
      number: false,
      specialChar: false,
    });
  }, []); // Run only on mount

  // Also clear when authentication state changes to not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setProfileData({
        name: '',
        email: '',
        password: '',
      });
      setErrors({});
      setIsFormValid(false);
      setPasswordFocused(false);
      setPasswordRuleStatus({
        minLength: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false,
      });
    }
  }, [isAuthenticated]);

  // Keyboard shortcut to auto-fill admin credentials (Ctrl/Cmd+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl+Shift+A (Windows/Linux) or Cmd+Shift+A (Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (isLoginMode) {
          setProfileData({
            name: '',
            email: process.env.SPEXTURE_APP_ADMIN_EMAIL || process.env.REACT_APP_ADMIN_EMAIL || 'admin@spexture-com.local',
            password: process.env.SPEXTURE_APP_ADMIN_PASSWORD || process.env.REACT_APP_ADMIN_PASSWORD || 'Admin123!',
          });
          toast.info('Admin credentials auto-filled');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginMode]);

  // Get the appropriate validation schema based on mode
  const getValidationSchema = () => {
    return isLoginMode ? buildLoginSchema() : buildRegisterSchema();
  };

  /**
   * Check if form is valid using Yup
   * Disables submit button when any required field is invalid
   */
  useEffect(() => {
    const checkFormValidity = async () => {
      try {
        const schema = getValidationSchema();
        const isValid = await schema.isValid(profileData);
        setIsFormValid(isValid);
      } catch (error) {
        setIsFormValid(false);
      }
    };

    checkFormValidity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData, isLoginMode]);

  /**
   * Validate a single field using Yup
   * Used for real-time validation on blur
   */
  const validateField = async (fieldName, value) => {
    try {
      // Validate single field using Yup with appropriate schema
      const schema = getValidationSchema();
      await schema.validateAt(fieldName, { [fieldName]: value });
      // Clear error for this field if validation passes
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[fieldName];
        return newErrors;
      });
    } catch (error) {
      // Set error for this field using Yup error message
      setErrors((prevErrors) => ({
        ...prevErrors,
        [fieldName]: error.message,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
    
    // Update password rule status in real-time
    if (name === 'password') {
      const config = validationConfig.password;
      setPasswordRuleStatus({
        minLength: value.length >= config.minLength,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        specialChar: config.specialChars.test(value),
      });
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Handle field blur event - validate field using Yup when user leaves the field
   */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    // Validate field on blur (including empty fields for required validation)
    validateField(name, value);
    
    // Hide password indicators on blur
    if (name === 'password') {
      setPasswordFocused(false);
    }
  };

  /**
   * Handle field focus event
   */
  const handleFocus = (e) => {
    const { name } = e.target;
    
    // Show password indicators on focus
    if (name === 'password') {
      setPasswordFocused(true);
    }
  };

  /**
   * Handle form submission - validates all fields using Yup before submitting
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    // Validate entire form using Yup schema
    try {
      // Use Yup to validate all fields with appropriate schema
      const schema = getValidationSchema();
      await schema.validate(profileData, { abortEarly: false });
      
      // All Yup validations passed - clear errors and submit
      setErrors({});
      setIsSubmitting(true);

      try {
        if (isLoginMode) {
          // Login mode - only email and password required
          const response = await authAPI.login(profileData.email, profileData.password);
          loginUser(response.user, response.token);
          // Clear form data after successful login
          setProfileData({ name: '', email: '', password: '' });
          navigate('/', { replace: true });
        } else {
          // Register mode - all fields required
          const response = await authAPI.register({
            name: profileData.name,
            email: profileData.email,
            password: profileData.password,
          });
          registerUser(response.user, response.token);
          // Clear form data after successful registration
          setProfileData({ name: '', email: '', password: '' });
          navigate('/', { replace: true });
        }
      } catch (apiError) {
        // Handle API errors
        toast.error(apiError.message || 'An error occurred. Please try again.');
        setErrors({ api: apiError.message });
      } finally {
        setIsSubmitting(false);
      }
    } catch (validationErrors) {
      // Yup validation failed - collect and display all errors
      const errorsObject = {};
      validationErrors.inner.forEach((error) => {
        errorsObject[error.path] = error.message;
      });
      setErrors(errorsObject);
      toast.error('Please fix the validation errors');
    }
  };

  const handleClear = () => {
    setProfileData({
      name: '',
      email: '',
      password: '',
    });
    setErrors({});
    setIsFormValid(false); // Form is invalid after clearing
  };

  const handleCancel = () => {
    // Navigate away from login/register page
    navigate('/', { replace: true });
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setErrors({});
    // Keep email and password, clear name when switching modes
    if (!isLoginMode) {
      setProfileData(prev => ({ ...prev, name: '' }));
    }
  };

  // Show loading spinner while submitting
  if (isSubmitting) {
    return <Loading message={isLoginMode ? "Logging in..." : "Creating your account..."} />;
  }

  return (
    <div>
      {/* Tab-style mode selector */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '20px', 
        borderBottom: '2px solid #e0e0e0' 
      }}>
        <button
          type="button"
          onClick={() => {
            if (isLoginMode) {
              toggleMode();
            }
          }}
          style={{
            flex: 1,
            padding: '12px 20px',
            background: !isLoginMode ? '#007bff' : 'transparent',
            color: !isLoginMode ? 'white' : '#666',
            border: 'none',
            borderBottom: !isLoginMode ? '2px solid #007bff' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: !isLoginMode ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          Register
        </button>
        <button
          type="button"
          onClick={() => {
            if (!isLoginMode) {
              toggleMode();
            }
          }}
          style={{
            flex: 1,
            padding: '12px 20px',
            background: isLoginMode ? '#007bff' : 'transparent',
            color: isLoginMode ? 'white' : '#666',
            border: 'none',
            borderBottom: isLoginMode ? '2px solid #007bff' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: isLoginMode ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          Login
        </button>
      </div>
      
      <form 
        onSubmit={handleSubmit} 
        className="profile-form" 
        autoComplete="off"
        noValidate
      >
        {/* Hidden dummy fields to confuse autofill */}
        <input type="text" name="fake-username" autoComplete="off" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" />
        <input type="password" name="fake-password" autoComplete="off" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" />
        
        {/* Show name field only in register mode */}
        {!isLoginMode && (
          <div className={`input-container ${errors.name ? 'error' : ''}`}>
            <div className="label-error-container">
              <label htmlFor="name">Name</label>
              {errors.name && <div className="error">{errors.name}</div>}
            </div>
            <input
              type="text"
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              data-lpignore="true"
              data-validation-field-type="name"
              required
              className={errors.name ? 'error-input' : ''}
            />
          </div>
        )}

        <div className={`input-container ${errors.email ? 'error' : ''}`}>
          <div className="label-error-container">
            <label htmlFor="email">Email</label>
            {errors.email && <div className="error">{errors.email}</div>}
          </div>
          <input
            type="email"
            id="email"
            name="email"
            value={profileData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-form-type="other"
            data-lpignore="true"
            data-validation-field-type="email"
            required
            className={errors.email ? 'error-input' : ''}
          />
        </div>

        <div className={`input-container ${errors.password ? 'error' : ''}`}>
          <div className="label-error-container">
            <label htmlFor="password">Password</label>
            {errors.password && <div className="error">{errors.password}</div>}
          </div>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={profileData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              data-lpignore="true"
              data-validation-field-type="password"
              required
              className={errors.password ? 'error-input' : ''}
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
          {passwordFocused && !isLoginMode && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              <strong>Password must contain:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px', listStyle: 'none' }}>
                <li style={{ color: passwordRuleStatus.minLength ? '#28a745' : '#dc3545' }}>
                  {passwordRuleStatus.minLength ? '✅' : '❌'} At least {validationConfig.password.minLength} characters
                </li>
                <li style={{ color: passwordRuleStatus.uppercase ? '#28a745' : '#dc3545' }}>
                  {passwordRuleStatus.uppercase ? '✅' : '❌'} 1 uppercase letter
                </li>
                <li style={{ color: passwordRuleStatus.lowercase ? '#28a745' : '#dc3545' }}>
                  {passwordRuleStatus.lowercase ? '✅' : '❌'} 1 lowercase letter
                </li>
                <li style={{ color: passwordRuleStatus.number ? '#28a745' : '#dc3545' }}>
                  {passwordRuleStatus.number ? '✅' : '❌'} 1 digit
                </li>
                <li style={{ color: passwordRuleStatus.specialChar ? '#28a745' : '#dc3545' }}>
                  {passwordRuleStatus.specialChar ? '✅' : '❌'} 1 symbol
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Display API errors */}
        {errors.api && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '4px',
            marginTop: '10px',
            color: '#c00'
          }}>
            {errors.api}
          </div>
        )}

        <div className="button-container">
          <button type="button" onClick={handleCancel}>Cancel</button>
          <button type="button" onClick={handleClear}>Clear</button>
          <button type="submit" disabled={!isFormValid || isSubmitting}>
            {isLoginMode ? 'Login' : 'Register'}
          </button>
        </div>
      </form>

      {/* Toggle between login and register - outside form since it's not part of form submission */}
      <div style={{ marginTop: '20px', textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
        </span>
        <button
          type="button"
          onClick={toggleMode}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {isLoginMode ? "Register here" : "Login here"}
        </button>
      </div>

      {/* Dev shortcut hint - only show in login mode */}
      {isLoginMode && (
        <div style={{
          marginTop: '10px',
          textAlign: 'center',
          padding: '8px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#856404'
        }}>
          <strong>Dev tip:</strong> Press <kbd style={{
            padding: '2px 6px',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '3px',
            fontFamily: 'monospace'
          }}>Ctrl+Shift+A</kbd> (or <kbd style={{
            padding: '2px 6px',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '3px',
            fontFamily: 'monospace'
          }}>Cmd+Shift+A</kbd> on Mac) to auto-fill admin credentials
        </div>
      )}
    </div>
  );
};

export default LoginRegister;
