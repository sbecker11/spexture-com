# ⚛️ Client Application Guide

Complete guide to the React client application, including components, routing, authentication, and validation.

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Project Structure](#-project-structure)
3. [Key Components](#-key-components)
4. [Routing & Navigation](#-routing--navigation)
5. [Authentication Flow](#-authentication-flow)
6. [Form Validation](#-form-validation)
7. [State Management](#-state-management)
8. [API Integration](#-api-integration)
9. [Styling](#-styling)

---

## 📊 Overview

The Spexture-com client is a single-page application built with React 18, featuring:
- User authentication and authorization
- Protected routes with role-based access
- Form validation with Yup
- Responsive UI components
- Integration with Express REST API

### Technology Stack

- **Framework**: React 18
- **Routing**: React Router v6
- **Validation**: Yup
- **HTTP Client**: Axios (via api.js)
- **Notifications**: react-toastify
- **Testing**: Jest + React Testing Library
- **Build Tool**: Create React App

---

## 🗂️ Project Structure

```
src/
├── components/              # UI Components
│   ├── Header.js           # Navigation header
│   ├── Footer.js           # Page footer
│   ├── Left.js            # Left sidebar
│   ├── Home.js            # Home page
│   ├── About.js           # About page
│   ├── LoginRegister.js   # Auth forms
│   ├── ProtectedRoute.js  # Route wrapper
│   ├── JDAnalyzer.js      # Job analyzer
│   ├── Profile.js         # User profile
│   ├── AdminDashboard.js  # Admin home
│   ├── UserManagement.js  # User list
│   ├── AdminAuthModal.js  # Admin re-auth
│   ├── ErrorBoundary.js   # Error handler
│   ├── Loading.js         # Spinner
│   └── NotFound.js        # 404 page
├── contexts/               # React Context
│   ├── AuthContext.js     # Auth state
│   └── ThemeContext.js    # Theme state
├── services/              # API Services
│   ├── api.js            # HTTP client
│   └── adminAPI.js       # Admin APIs
├── validation/            # Validation
│   └── fieldValidation.js
├── App.js                 # Main app
├── App.css                # Main styles
├── index.js              # Entry point
└── index.css             # Global styles
```

---

## 🧩 Key Components

### Header Component

**File**: `src/components/Header.js`

**Purpose**: Navigation bar with auth-aware menu

**Features**:
- Logo and app title
- Navigation links
- Conditional rendering based on auth status
- Admin menu for admin users
- Logout button

**Usage**:
```jsx
<Header />
```

### LoginRegister Component

**File**: `src/components/LoginRegister.js`

**Purpose**: Combined login and registration forms

**Features**:
- Tab-based UI (Login/Register)
- Yup validation
- API integration
- Toast notifications
- Loading states
- Redirects after success

**Form Fields**:
- Name (register only): 2-50 chars, letters/spaces/hyphens/apostrophes
- Email: Valid email format
- Password: 8-50 chars, uppercase, lowercase, number, special char

**API Integration**:
```javascript
// Registration
const response = await authAPI.register({ name, email, password });

// Login
const response = await authAPI.login({ email, password });
```

### ProtectedRoute Component

**File**: `src/components/ProtectedRoute.js`

**Purpose**: Wrapper for routes requiring authentication

**Features**:
- Checks auth status from AuthContext
- Shows loading spinner during auth check
- Redirects to login if not authenticated
- Passes through if authenticated

**Usage**:
```jsx
<Route path="/profile" element={
  <ProtectedRoute>
    <Profile />
  </ProtectedRoute>
} />
```

### AdminAuthModal Component

**File**: `src/components/AdminAuthModal.js`

**Purpose**: Password re-authentication for sensitive admin operations

**Features**:
- Modal overlay
- Password input
- 15-minute session notice
- Integration with AuthContext
- Keyboard navigation
- ARIA labels

**Usage**:
```jsx
<AdminAuthModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={() => performAdminAction()}
/>
```

### ErrorBoundary Component

**File**: `src/components/ErrorBoundary.js`

**Purpose**: Catch React errors and display fallback UI

**Features**:
- Catches errors in child components
- Displays error message
- Shows stack trace in development
- Prevents app crashes

**Usage**:
```jsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Loading Component

**File**: `src/components/Loading.js`

**Purpose**: Reusable loading spinner

**Features**:
- Customizable size
- Optional message
- Centered layout

**Usage**:
```jsx
<Loading size={50} message="Loading data..." />
```

---

## 🛣️ Routing & Navigation

### Route Configuration

**File**: `src/App.js`

```jsx
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<Home />} />
  <Route path="/home" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="/login-register" element={<LoginRegister />} />

  {/* Protected Routes */}
  <Route path="/analyzer" element={
    <ProtectedRoute><JDAnalyzer /></ProtectedRoute>
  } />
  <Route path="/profile" element={
    <ProtectedRoute><Profile /></ProtectedRoute>
  } />

  {/* Admin Routes */}
  <Route path="/admin" element={
    <ProtectedRoute><AdminDashboard /></ProtectedRoute>
  } />
  <Route path="/admin/users" element={
    <ProtectedRoute><UserManagement /></ProtectedRoute>
  } />

  {/* 404 */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

### Navigation Links

**Header Navigation**:
- Home
- About
- Job Analyzer (protected)
- Profile (protected)
- Admin (admin only)
- Login/Logout

**Programmatic Navigation**:
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/home'); // Redirect to home
```

---

## 🔐 Authentication Flow

### AuthContext

**File**: `src/contexts/AuthContext.js`

**Purpose**: Global authentication state management

**State**:
```javascript
{
  user: { id, name, email, role },
  token: 'jwt-token',
  isAuthenticated: true/false,
  loading: true/false,
  elevatedToken: 'elevated-jwt',
  elevatedExpiry: timestamp
}
```

**Methods**:
```javascript
// Authentication
login(email, password)
logout()
register(name, email, password)
updateUser(userId, userData)

// Role checking
isAdmin()
hasRole(role)

// Elevated sessions
requestElevatedSession(password)
hasElevatedSession()
clearElevatedSession()
```

**Usage**:
```jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <p>Please log in</p>;
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      {isAdmin() && <p>You are an admin</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Authentication Flow Diagram

```
User → LoginRegister → AuthContext.login()
                            ↓
                    POST /api/auth/login
                            ↓
                    Receive JWT token
                            ↓
                Store token in localStorage
                            ↓
                Update AuthContext state
                            ↓
                Redirect to home
                            ↓
                ProtectedRoute checks auth
                            ↓
                Allow access to protected pages
```

---

## ✅ Form Validation

### Validation Strategy

- **Client-side**: Yup validation for immediate feedback
- **Server-side**: Express validation for security
- **Real-time**: Validation on blur
- **Visual feedback**: Red borders and error messages

### Validation Rules

#### Name Field
- Required
- 2-50 characters
- Only letters, spaces, hyphens, apostrophes

#### Email Field
- Required
- Valid email format
- Example shown in error: "user@example.com"

#### Password Field
- Required
- 8-50 characters
- Must include:
  - Uppercase letter
  - Lowercase letter
  - Number
  - Special character (!@#$%^&*)

### Error Messages

**Example Error Messages**:
- "Name is required"
- "Name must be at least 2 characters"
- "Invalid email address. Example: user@example.com"
- "Password must be at least 8 characters"
- "Password must contain at least one uppercase letter (A-Z)"

### Validation Implementation

```javascript
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters...'),

  email: Yup.string()
    .required('Email is required')
    .email('Invalid email address. Example: user@example.com'),

  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(50, 'Password must be less than 50 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*]/, 'Password must contain at least one special character')
});
```

---

## 🎯 State Management

### React Context API

**Contexts Used**:
1. **AuthContext** - Authentication state
2. **ThemeContext** - Light/dark theme (planned)

**Why Context API?**
- Built into React (no extra dependencies)
- Simple for small to medium apps
- Perfect for global state like auth
- Easy to test

**Context Pattern**:
```jsx
// Create Context
const AuthContext = createContext();

// Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const value = {
    user,
    token,
    login: async (email, password) => { /* ... */ },
    logout: () => { /* ... */ },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## 🔌 API Integration

### API Service Layer

**File**: `src/services/api.js`

**Purpose**: Centralized HTTP client with token management

**Features**:
- Automatic token injection
- Error handling
- Request/response interceptors
- Separate methods for different endpoints

**Base Configuration**:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**API Methods**:
```javascript
// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

// User API
export const userAPI = {
  getMe: () => api.get('/users/me'),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
};
```

### Admin API Service

**File**: `src/services/adminAPI.js`

**Purpose**: Admin-specific API methods

**Methods**:
```javascript
export const adminAPI = {
  verifyPassword: (password) => api.post('/admin/verify-password', { password }),
  listUsers: (params) => api.get('/admin/users', { params }),
  changeUserRole: (userId, role, elevatedToken) =>
    api.put(`/admin/users/${userId}/role`, { role }, {
      headers: { 'X-Elevated-Token': elevatedToken }
    }),
  // ... more methods
};
```

### Usage Example

```javascript
import { authAPI, userAPI } from '../services/api';

// In a component
async function handleLogin() {
  try {
    const response = await authAPI.login({ email, password });
    setToken(response.data.token);
    setUser(response.data.user);
    navigate('/home');
  } catch (error) {
    toast.error(error.response?.data?.error || 'Login failed');
  }
}
```

---

## 🎨 Styling

### CSS Strategy

- **Component-specific CSS**: Each component has its own CSS file
- **Global styles**: `index.css` for app-wide styles
- **Responsive design**: Media queries for mobile support
- **CSS Variables**: For consistent colors and spacing

### Example Component Styles

**LoginRegister.css**:
```css
.login-register-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.input-error {
  border-color: #dc3545;
}
```

### Responsive Design

```css
/* Mobile-first approach */
.container {
  padding: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
}
```

---

## 📚 Additional Resources

### Internal Documentation
- **Server API**: [`05_SERVER.md`](./05_SERVER.md)
- **Database**: [`04_DATABASE.md`](./04_DATABASE.md)
- **Testing**: [`07_TESTING.md`](./07_TESTING.md)
- **Validation Guide**: [`VALIDATION_GUIDE.md`](./VALIDATION_GUIDE.md)

### External Resources
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [React Router](https://reactrouter.com/)
- [Yup Validation](https://github.com/jquense/yup)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

**Client Status**: ✅ Production Ready
**Integration**: ✅ Complete
**Testing**: ✅ 52% Coverage
