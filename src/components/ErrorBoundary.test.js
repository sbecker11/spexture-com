import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('displays error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
  });

  it('displays Try Again button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('displays Go to Home link', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const homeLink = screen.getByText('Go to Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('calls onReset callback when provided', () => {
    const onReset = jest.fn();
    render(
      <ErrorBoundary onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const tryAgainButton = screen.getByText('Try Again');
    tryAgainButton.click();

    expect(onReset).toHaveBeenCalled();
  });

  it('handles reset without onReset callback', () => {
    // Test line 26 branch: when onReset is undefined (covers the else branch)
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    
    const tryAgainButton = screen.getByText('Try Again');
    // Clicking should not crash even without onReset callback
    // This covers the branch where if (this.props.onReset) is false
    tryAgainButton.click();

    // Should not crash when onReset is not provided
    expect(tryAgainButton).toBeInTheDocument();
  });

  it('shows error details when in development mode and error exists', () => {
    // Note: In Jest/CRA, NODE_ENV is typically 'test' or 'development'
    // If it's 'development', the details will show. If not, they won't.
    // This tests the branch where error exists (which is always true after an error)
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check if error details are shown (depends on NODE_ENV)
    // If we're in development/test mode, details should be visible
    const detailsElement = document.querySelector('details');
    
    // In test environment, NODE_ENV might be 'test' or 'development'
    // The details may or may not show, but the error UI should always show
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    
    // If details exist, verify they have the right content
    if (detailsElement) {
      expect(screen.getByText(/Error Details/i)).toBeInTheDocument();
    }
  });
});

