import React from 'react';

const Loading = ({ 
  size = 'medium', 
  message = 'Loading...',
  fullScreen = false 
}) => {
  const sizeStyles = {
    small: { width: '24px', height: '24px', borderWidth: '2px' },
    medium: { width: '40px', height: '40px', borderWidth: '3px' },
    large: { width: '60px', height: '60px', borderWidth: '4px' }
  };

  const spinnerStyle = {
    border: `${sizeStyles[size].borderWidth} solid #f3f3f3`,
    borderTop: `${sizeStyles[size].borderWidth} solid #007bff`,
    borderRadius: '50%',
    width: sizeStyles[size].width,
    height: sizeStyles[size].height,
    animation: 'spin 1s linear infinite',
    margin: '0 auto'
  };

  const containerStyle = fullScreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 9999
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 20px'
      };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle}></div>
      {message && (
        <p style={{
          marginTop: '20px',
          fontSize: '16px',
          color: '#666',
          textAlign: 'center'
        }}>
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loading;

