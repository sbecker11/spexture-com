import React from 'react';
import { render, screen } from '@testing-library/react';
import DevTools from './DevTools';

// Mock PageContainer to avoid dependencies
jest.mock('./PageContainer', () => {
  return function MockPageContainer({ children }) {
    return <div data-testid="page-container">{children}</div>;
  };
});

describe('DevTools Component', () => {
  beforeEach(() => {
    // Set up default environment variables
    process.env.NODE_ENV = 'test';
    process.env.REACT_APP_API_URL = 'http://localhost:3001/api';
  });

  it('renders without crashing', () => {
    render(<DevTools />);
    expect(screen.getByTestId('page-container')).toBeInTheDocument();
  });

  it('renders the main heading', () => {
    render(<DevTools />);
    expect(screen.getByRole('heading', { name: /development tools/i, level: 1 })).toBeInTheDocument();
  });

  it('renders the description paragraph', () => {
    render(<DevTools />);
    expect(screen.getByText(/this page provides quick access to development resources/i)).toBeInTheDocument();
  });

  it('renders Quick Links section', () => {
    render(<DevTools />);
    expect(screen.getByRole('heading', { name: /quick links/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/react devtools/i)).toBeInTheDocument();
    expect(screen.getByText(/redux devtools/i)).toBeInTheDocument();
    expect(screen.getByText(/network tab/i)).toBeInTheDocument();
  });

  it('renders Environment section with correct information', () => {
    render(<DevTools />);
    expect(screen.getByRole('heading', { name: /environment/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/node environment:/i)).toBeInTheDocument();
    expect(screen.getByText(/react version:/i)).toBeInTheDocument();
    expect(screen.getByText(/api base url:/i)).toBeInTheDocument();
  });

  it('displays the NODE_ENV value', () => {
    render(<DevTools />);
    // More specific matcher - look for the exact text pattern with NODE_ENV
    expect(screen.getByText(/Node Environment:/i)).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('displays the React version', () => {
    render(<DevTools />);
    // React.version should be present in the document
    const reactVersionRegex = new RegExp(React.version.replace(/\./g, '\\.'));
    expect(screen.getByText(reactVersionRegex)).toBeInTheDocument();
  });

  it('displays the API Base URL from environment variable', () => {
    render(<DevTools />);
    expect(screen.getByText(/http:\/\/localhost:3001\/api/i)).toBeInTheDocument();
  });

  it('displays default API URL when env variable is not set', () => {
    // Temporarily clear the env variable
    const originalApiUrl = process.env.REACT_APP_API_URL;
    delete process.env.REACT_APP_API_URL;

    render(<DevTools />);
    expect(screen.getByText(/http:\/\/localhost:5000/i)).toBeInTheDocument();

    // Restore the env variable
    process.env.REACT_APP_API_URL = originalApiUrl;
  });

  it('renders Test Commands section', () => {
    render(<DevTools />);
    expect(screen.getByRole('heading', { name: /test commands/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/npm test/i)).toBeInTheDocument();
    expect(screen.getByText(/npm run test:coverage/i)).toBeInTheDocument();
    expect(screen.getByText(/npm run build/i)).toBeInTheDocument();
  });

  it('renders Keyboard Shortcuts section', () => {
    render(<DevTools />);
    expect(screen.getByRole('heading', { name: /useful keyboard shortcuts/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/auto-fill admin credentials/i)).toBeInTheDocument();
  });

  it('displays keyboard shortcut hints with kbd elements', () => {
    const { container } = render(<DevTools />);
    const kbdElements = container.querySelectorAll('kbd');
    expect(kbdElements.length).toBeGreaterThan(0);
    // Should have Ctrl+Shift+A and Cmd+Shift+A
    expect(kbdElements.length).toBeGreaterThanOrEqual(2);
  });

  it('renders all section headings', () => {
    render(<DevTools />);
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThanOrEqual(5); // Main heading + 4 section headings
  });

  it('uses PageContainer component', () => {
    render(<DevTools />);
    expect(screen.getByTestId('page-container')).toBeInTheDocument();
  });
});
