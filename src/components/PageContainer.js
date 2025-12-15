import React from 'react';
import './PageContainer.css';

/**
 * PageContainer - A reusable layout component for consistent page styling
 * 
 * Usage:
 *   <PageContainer>
 *     <h1>Page Title</h1>
 *     <p>Page content...</p>
 *   </PageContainer>
 * 
 * Props:
 *   - children: The content to render inside the container
 *   - className: Additional CSS classes (optional)
 *   - maxWidth: Maximum width of the content (default: 'none')
 */
const PageContainer = ({ children, className = '', maxWidth = 'none' }) => {
  const containerStyle = {
    maxWidth: maxWidth !== 'none' ? maxWidth : '100%',
  };

  return (
    <div className={`page-container ${className}`} style={containerStyle}>
      {children}
    </div>
  );
};

export default PageContainer;

