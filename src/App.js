import React from "react";
import { BrowserRouter as Router } from "react-router-dom"; // Import the router components and Routes
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from "./components/Header";
import Left from "./components/Left";
import Footer from "./components/Footer";
import "./App.css"; // Import the CSS file
import About from "./components/About";
import Home from "./components/Home";
import LoginRegister from "./components/LoginRegister";
import JDAnalyzer from './components/JDAnalyzer';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement';
import TestingCoverage from './components/TestingCoverage';
import NotFound from './components/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import DevTools from './components/DevTools';

function App() {
  function handleHomeClick() {
    console.log("handleHomeClick");
  }
  function handleAboutClick() {
    console.log("handleAboutClick");
  }
  function handleLoginRegisterClick() {
    console.log("handleLoginRegisterClick");
  }

  const body_content = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/home" element={<Home />} />
      <Route path="/dev-tools" element={<DevTools />} />
      <Route path="/login-register" element={<LoginRegister />} />
      <Route 
        path="/analyzer" 
        element={
          <ProtectedRoute>
            <JDAnalyzer />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/testing"
        element={
          <ProtectedRoute>
            <TestingCoverage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <div className="App">
              <Header
                onHomeClick={handleHomeClick}
                onAboutClick={handleAboutClick}
                onLoginRegisterClick={handleLoginRegisterClick}
              />
              <div className="container">
                <Left />
                <div className="body-content">
                  {body_content}
                </div>
              </div>
              <Footer />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
              />
            </div>
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
