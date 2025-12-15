import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageContainer from './PageContainer';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './TestingCoverage.css';

const API_URL = process.env.SPEXTURE_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3011/api';

const TestingCoverage = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clientReport, setClientReport] = useState(null);
  const [serverReport, setServerReport] = useState(null);
  const [activeTab, setActiveTab] = useState('client'); // 'client' or 'server'

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/coverage/all`);

      if (!response.ok) {
        throw new Error('Failed to fetch coverage reports');
      }

      const data = await response.json();
      setClientReport(data.client);
      setServerReport(data.server);
    } catch (error) {
      console.error('Error loading coverage reports:', error);
      toast.error('Failed to load coverage reports. Make sure tests have been run with coverage.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  const handleRunCoverage = async () => {
    try {
      toast.info(`Opening terminal to run ${activeTab} coverage tests...`);

      const response = await fetch(`${API_URL}/coverage/run/${activeTab}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Terminal opened! Tests are running in new window.');
      } else {
        toast.error(data.error || 'Failed to open terminal');
      }
    } catch (error) {
      console.error('Error running coverage:', error);
      toast.error('Failed to trigger coverage tests');
    }
  };

  // Fetch coverage reports on mount
  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect non-admins (after all hooks)
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <PageContainer>
        <h1>Testing & Coverage Reports</h1>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading coverage reports...</p>
        </div>
      </PageContainer>
    );
  }

  const currentReport = activeTab === 'client' ? clientReport : serverReport;

  return (
    <PageContainer>
      <div className="testing-header">
        <h1>Testing & Coverage Reports</h1>
      </div>

      {/* Tab Navigation */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'client' ? 'active' : ''}`}
          onClick={() => setActiveTab('client')}
        >
          🧪 Client Coverage
        </button>
        <button
          className={`tab ${activeTab === 'server' ? 'active' : ''}`}
          onClick={() => setActiveTab('server')}
        >
          🔧 Server Coverage
        </button>
      </div>

      {/* Report Content */}
      <div className="report-container">
        {!currentReport ? (
          <div className="no-report">
            <h2>No {activeTab} coverage report available</h2>
            <p>Please run tests with coverage to generate a report:</p>
            {activeTab === 'client' ? (
              <code>npm run test:coverage</code>
            ) : (
              <code>cd server && npm test -- --coverage</code>
            )}
          </div>
        ) : (
          <>
            <div className="report-header-section">
              <h2>{activeTab === 'client' ? 'Client' : 'Server'} Test Coverage Report</h2>
              <div className="regenerate-controls">
                <button
                  onClick={handleRunCoverage}
                  className="btn-run-coverage"
                  title="Opens a new terminal window and runs coverage tests"
                >
                  🚀 Run Coverage Tests
                </button>
                <div className="terminal-helper-text" style={{ marginTop: '12px', marginLeft: '0' }}>
                  ⏱️ Takes ~60-90 seconds. After completion, refresh this page to see updated coverage report, or{' '}
                  <a
                    href={`${API_URL}/coverage/html/${activeTab}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="html-report-link"
                  >
                    click this link
                  </a>
                  {' '}to see the HTML-formatted report in a new window.
                </div>
              </div>
            </div>

            <div className="report-meta">
              <span className="report-timestamp">
                Last updated: {formatDateTime(currentReport.lastModified)}
              </span>
              <span className="report-size">
                Report size: {(currentReport.size / 1024).toFixed(2)} KB
              </span>
            </div>

            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentReport.markdown}
              </ReactMarkdown>
            </div>
          </>
        )}
      </div>

      {/* Help Section */}
      <div className="testing-info">
        <div className="info-card">
          <h3>📝 Running Tests</h3>
          <h4>Client Tests:</h4>
          <ul>
            <li><code>npm test</code> - Run all client tests</li>
            <li><code>npm run test:coverage</code> - Run tests with coverage</li>
            <li><code>npm run test:integration</code> - Run integration tests</li>
          </ul>
          <h4>Server Tests:</h4>
          <ul>
            <li><code>cd server && npm test</code> - Run all server tests</li>
            <li><code>cd server && npm test -- --coverage</code> - Run with coverage</li>
            <li><code>cd server && npm test -- api.test.js</code> - Run specific test</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>ℹ️ Understanding Coverage</h3>
          <ul>
            <li><strong>Lines:</strong> Percentage of code lines executed during tests</li>
            <li><strong>Statements:</strong> Percentage of code statements executed</li>
            <li><strong>Functions:</strong> Percentage of functions called</li>
            <li><strong>Branches:</strong> Percentage of conditional branches tested</li>
          </ul>
          <p><strong>Target:</strong> Aim for at least 80% coverage across all metrics</p>
        </div>

        <div className="info-card">
          <h3>🧪 Understanding Tests</h3>
          <ul>
            <li><strong>Unit Tests:</strong> Test individual components or functions in isolation</li>
            <li><strong>Integration Tests:</strong> Test how multiple components work together end-to-end</li>
            <li><strong>API Tests:</strong> Validate REST API endpoints, request/response handling</li>
            <li><strong>Middleware Tests:</strong> Test authentication, authorization, and request processing</li>
            <li><strong>Client Tests:</strong> Frontend React components, hooks, and UI interactions</li>
            <li><strong>Server Tests:</strong> Backend routes, database operations, and business logic</li>
          </ul>
          <p><strong>Best Practice:</strong> Combine different test types for comprehensive coverage</p>
        </div>
      </div>
    </PageContainer>
  );
};

export default TestingCoverage;
