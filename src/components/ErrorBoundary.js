import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console (in production, you'd log to an error reporting service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally navigate to home
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '48px', margin: '0', color: '#dc3545' }}>
            ⚠️ Something went wrong
          </h1>
          <h2 style={{ fontSize: '24px', margin: '20px 0', color: '#333' }}>
            An unexpected error occurred
          </h2>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', maxWidth: '600px' }}>
            We're sorry for the inconvenience. The error has been logged and we'll look into it.
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              textAlign: 'left',
              maxWidth: '800px',
              marginBottom: '30px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #dee2e6'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                overflow: 'auto',
                fontSize: '12px',
                color: '#dc3545',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleReset}
            style={{
              padding: '12px 30px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--button-border-radius)',
              fontSize: 'var(--button-font-size)',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Try Again
          </button>
          
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 'var(--button-border-radius)',
              fontSize: 'var(--button-font-size)',
              fontWeight: 'bold'
            }}
          >
            Go to Home
          </a>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

