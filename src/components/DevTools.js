import React from 'react';
import PageContainer from './PageContainer';

function DevTools() {
  return (
    <PageContainer>
      <h1>Development Tools</h1>
      <p>
        This page provides quick access to development resources and information.
      </p>

      <h2>Quick Links</h2>
      <ul>
        <li><strong>React DevTools:</strong> Browser extension for debugging React applications</li>
        <li><strong>Redux DevTools:</strong> Monitor state changes and actions</li>
        <li><strong>Network Tab:</strong> Monitor API requests and responses</li>
      </ul>

      <h2>Environment</h2>
      <ul>
        <li><strong>Node Environment:</strong> {process.env.NODE_ENV}</li>
        <li><strong>React Version:</strong> {React.version}</li>
        <li><strong>API Base URL:</strong> {process.env.SPEXTURE_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3011/api'}</li>
      </ul>

      <h2>Test Commands</h2>
      <ul>
        <li><code>npm test</code> - Run test suite</li>
        <li><code>npm run test:coverage</code> - Run tests with coverage report</li>
        <li><code>npm run build</code> - Create production build</li>
      </ul>

      <h2>Useful Keyboard Shortcuts</h2>
      <ul>
        <li><kbd>Ctrl+Shift+A</kbd> (or <kbd>Cmd+Shift+A</kbd>) - Auto-fill admin credentials on login page</li>
      </ul>
    </PageContainer>
  );
}

export default DevTools;
