import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import Loading from './Loading';
import { validateField as validateFieldUtil } from '../validation';
import PageContainer from './PageContainer';
import './LoginRegister.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser, isAdmin } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fullUserData, setFullUserData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [originalFormData, setOriginalFormData] = useState({
    name: '',
    email: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch full user data including created_at
  // React will automatically re-render when fullUserData state changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Fetch full user data from API (includes createdAt)
        const response = await usersAPI.getCurrent();
        if (response?.user) {
          setFullUserData(response.user);
          const initialData = {
            name: response.user.name || '',
            email: response.user.email || '',
          };
          setFormData(initialData);
          setOriginalFormData(initialData);
        }
      } catch (error) {
        console.error('Failed to fetch full user data:', error);
        // Fallback to context user data
        setFullUserData(user);
        const initialData = {
          name: user.name || '',
          email: user.email || '',
        };
        setFormData(initialData);
        setOriginalFormData(initialData);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors };
    const errorMessage = validateFieldUtil(fieldName, value);
    
    if (errorMessage) {
      errors[fieldName] = errorMessage;
    } else {
      delete errors[fieldName];
    }
    
    setFieldErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSaving || !hasChanges) return;
    
    // Validate all fields before submitting
    validateField('name', formData.name);
    validateField('email', formData.email);
    
    // Check if there are any validation errors
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    
    const nameError = (trimmedName.length < 2 || trimmedName.length > 50) 
      ? 'Name must be between 2 and 50 characters'
      : !/^[a-zA-Z0-9\s'-]+$/.test(trimmedName)
      ? 'Name can only contain letters, numbers, spaces, hyphens, and apostrophes'
      : null;
    
    const emailError = trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
      ? 'Invalid email address'
      : null;
    
    if (nameError || emailError) {
      setFieldErrors({
        name: nameError,
        email: emailError,
      });
      toast.error(nameError || emailError || 'Please fix validation errors');
      return;
    }
    
    setIsSaving(true);
    try {
      // Prepare data - trim values before sending
      const updateData = {
        name: trimmedName,
        email: trimmedEmail,
      };
      
      console.log('Sending update data:', updateData);
      const response = await usersAPI.update(user.id, updateData);
      updateUser(response.user);
      // Update original form data to new values after successful save
      setOriginalFormData(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      // Extract error message from various error formats
      let errorMessage = 'Failed to update profile';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (error.errors && Array.isArray(error.errors)) {
        // Handle express-validator format (msg) and other formats
        errorMessage = error.errors.map(e => e.msg || e.message || e).join(', ');
      } else if (error.data?.error) {
        errorMessage = error.data.error;
      } else if (error.data?.errors && Array.isArray(error.data.errors)) {
        // Handle express-validator format (msg) and other formats
        errorMessage = error.data.errors.map(e => e.msg || e.message || e).join(', ');
      }
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    // Reset form data to original values but stay in edit mode
    setFormData({
      name: originalFormData.name || '',
      email: originalFormData.email || '',
    });
    setFieldErrors({});
  };

  const handleCancel = () => {
    // Reset form data to original values and exit edit mode
    setFormData({
      name: originalFormData.name || '',
      email: originalFormData.email || '',
    });
    setFieldErrors({});
    setIsEditing(false);
  };

  // Check if form data has changed from original
  const hasChanges = formData.name !== originalFormData.name || 
                     formData.email !== originalFormData.email;
  
  // Check if there are any validation errors
  const hasValidationErrors = Object.keys(fieldErrors).length > 0;

  const handleLogout = () => {
    // Navigate to home first, then logout to prevent redirect to login-register
    navigate('/', { replace: true });
    logout();
  };

  if (!user) {
    return <Loading message="Loading profile..." />;
  }

  if (loading) {
    return <Loading message="Loading profile..." />;
  }

  if (isSaving) {
    return <Loading message="Saving profile..." />;
  }

  // React automatically re-renders when fullUserData state changes
  // Use fullUserData if available, otherwise fallback to user from context
  const displayUser = fullUserData || user;
  
  // Debug: Log what we're about to render
  console.log('Rendering Profile with:', {
    hasFullUserData: !!fullUserData,
    fullUserDataName: fullUserData?.name,
    fullUserDataEmail: fullUserData?.email,
    fullUserDataCreatedAt: fullUserData?.createdAt,
    displayUserName: displayUser?.name,
    displayUserEmail: displayUser?.email,
    displayUserCreatedAt: displayUser?.createdAt,
    'displayUser === fullUserData': displayUser === fullUserData,
    'displayUser === user': displayUser === user,
  });

  return (
    <PageContainer maxWidth="600px">
      <h2>{isAdmin() ? 'Admin Profile' : 'User Profile'}</h2>

      <div style={{ 
        border: '1px solid var(--sidebar-bg)', 
        borderRadius: '8px', 
        padding: '20px',
        backgroundColor: 'var(--sidebar-bg)',
        color: 'var(--text-color)'
      }}>
        {!isEditing ? (
          // View Mode
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-color)', opacity: 0.8 }}>
                Name:
              </label>
              <p style={{ margin: 0, fontSize: '18px', color: 'var(--text-color)' }}>
                {fullUserData?.name || user?.name || 'N/A'}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-color)', opacity: 0.8 }}>
                Email:
              </label>
              <p style={{ margin: 0, fontSize: '18px', color: 'var(--text-color)' }}>
                {fullUserData?.email || user?.email || 'N/A'}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-color)', opacity: 0.8 }}>
                User ID:
              </label>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-color)', fontFamily: 'monospace', opacity: 0.7 }}>
                {fullUserData?.id || user?.id || 'N/A'}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-color)', opacity: 0.8 }}>
                Member Since:
              </label>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-color)' }}>
                {(fullUserData?.createdAt || fullUserData?.created_at || user?.createdAt || user?.created_at) ? 
                  new Date(fullUserData?.createdAt || fullUserData?.created_at || user?.createdAt || user?.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button
                onClick={() => {
                  // Store current values as original when entering edit mode
                  setOriginalFormData({
                    name: fullUserData?.name || user?.name || '',
                    email: fullUserData?.email || user?.email || '',
                  });
                  setIsEditing(true);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--button-border-radius)',
                  fontSize: 'var(--button-font-size)',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--button-border-radius)',
                  fontSize: 'var(--button-font-size)',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleSubmit} className="profile-form">
            <div className={`input-container ${fieldErrors.name ? 'error' : ''}`}>
              <div className="label-error-container">
                <label htmlFor="name">Name</label>
                {fieldErrors.name && <div className="error">{fieldErrors.name}</div>}
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={(e) => validateField('name', e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                data-lpignore="true"
                data-validation-field-type="name"
                required
                className={fieldErrors.name ? 'error-input' : ''}
              />
            </div>

            <div className={`input-container ${fieldErrors.email ? 'error' : ''}`}>
              <div className="label-error-container">
                <label htmlFor="email">Email</label>
                {fieldErrors.email && <div className="error">{fieldErrors.email}</div>}
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={(e) => validateField('email', e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                data-lpignore="true"
                data-validation-field-type="email"
                required
                className={fieldErrors.email ? 'error-input' : ''}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--button-border-radius)',
                  fontSize: 'var(--button-font-size)',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={!hasChanges}
                style={{
                  padding: '10px 20px',
                  backgroundColor: !hasChanges ? '#a0a0a0' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--button-border-radius)',
                  fontSize: 'var(--button-font-size)',
                  cursor: !hasChanges ? 'not-allowed' : 'pointer',
                  opacity: !hasChanges ? 0.5 : 1,
                  flex: 1
                }}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSaving || !hasChanges || hasValidationErrors}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (isSaving || !hasChanges || hasValidationErrors) ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--button-border-radius)',
                  fontSize: 'var(--button-font-size)',
                  cursor: (isSaving || !hasChanges || hasValidationErrors) ? 'not-allowed' : 'pointer',
                  opacity: (isSaving || !hasChanges || hasValidationErrors) ? 0.5 : 1,
                  flex: 1
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
          </div>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--sidebar-bg)', borderRadius: '4px', border: '1px solid var(--sidebar-bg)' }}>
            <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-color)', opacity: 0.7, fontSize: '14px' }}>
              💡 Note: Password changes are not yet implemented. Contact support to reset your password.
            </p>
          </div>
    </PageContainer>
  );
};

export default Profile;

