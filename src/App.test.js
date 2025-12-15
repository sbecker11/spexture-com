import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from './App';
import * as api from './services/api';

// Mock CSS imports
jest.mock('react-toastify/dist/ReactToastify.css', () => ({}));

// Mock TestingCoverage to avoid react-markdown import issues
jest.mock('./components/TestingCoverage', () => {
  return function MockTestingCoverage() {
    return <div data-testid="testing-coverage">Testing Coverage</div>;
  };
});

// Mock authAPI.getCurrentUser to prevent real API calls in AuthProvider
jest.mock('./services/api', () => {
  const actual = jest.requireActual('./services/api');
  return {
    ...actual,
    authAPI: {
      ...actual.authAPI,
      getCurrentUser: jest.fn().mockRejectedValue(new Error('Not authenticated')),
    },
  };
});

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.removeItem('token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders without crashing', async () => {
    render(<App />);
    // Wait for AuthProvider to finish loading
    await waitFor(() => {
      // There are multiple "Home" links (header and sidebar), so use getAllByText
      const homeLinks = screen.getAllByText('Home');
      expect(homeLinks.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it('renders Header component', async () => {
    render(<App />);
    await waitFor(() => {
      // There are multiple "Home" links (header and sidebar), so use getAllByText
      const homeLinks = screen.getAllByText('Home');
      expect(homeLinks.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
    const aboutLinks = screen.getAllByText('About');
    expect(aboutLinks.length).toBeGreaterThan(0);
    const loginLinks = screen.getAllByText('Login/Register');
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  it('renders Footer component', async () => {
    render(<App />);
    await waitFor(() => {
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays Home page by default', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Welcome to Our Website')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('navigates to About page when About link is clicked', async () => {
    render(<App />);
    
    await waitFor(() => {
      // Wait for at least one Home link to appear (there are multiple)
      const homeLinks = screen.getAllByText(/home/i);
      expect(homeLinks.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
    
    const aboutLink = screen.getAllByText(/about/i)[0];
    fireEvent.click(aboutLink);
    
    await waitFor(() => {
      expect(screen.getByText('About Us')).toBeInTheDocument();
    });
  });

  it('navigates to Login/Register page when link is clicked', async () => {
    render(<App />);
    
    await waitFor(() => {
      // There are multiple "Home" links (header and sidebar), so use getAllByText
      const homeLinks = screen.getAllByText('Home');
      expect(homeLinks.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
    
    const loginLink = screen.getAllByText(/login\/register/i)[0];
    fireEvent.click(loginLink);
    
    await waitFor(() => {
      // There may be multiple "Register" elements, so use getAllByText
      const registerElements = screen.getAllByText('Register');
      expect(registerElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('navigates back to Home when Home link is clicked', async () => {
    render(<App />);
    
    await waitFor(() => {
      // Wait for at least one Home link to appear (there are multiple)
      const homeLinks = screen.getAllByText(/home/i);
      expect(homeLinks.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
    
    // Navigate away from home first
    const aboutLink = screen.getAllByText(/about/i)[0];
    fireEvent.click(aboutLink);
    
    await waitFor(() => {
      expect(screen.getByText('About Us')).toBeInTheDocument();
    });
    
    // Then navigate back to home
    const homeLink = screen.getAllByText(/home/i)[0];
    fireEvent.click(homeLink);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to Our Website')).toBeInTheDocument();
    });
  });

  it('renders Left sidebar with navigation links', async () => {
    render(<App />);
    await waitFor(() => {
      // Left sidebar should have the same links as header
      // Since both Header and Left have the same links, we should find at least 2 of each (one in header, one in sidebar)
      const homeLinks = screen.getAllByText('Home');
      expect(homeLinks.length).toBeGreaterThanOrEqual(2);
    }, { timeout: 3000 });
  });

  it('has correct container structure', async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(container.querySelector('.left-column')).toBeInTheDocument();
      expect(container.querySelector('.body-content')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});