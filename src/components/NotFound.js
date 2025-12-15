import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
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
      <h1 style={{ fontSize: '72px', margin: '0', color: '#666' }}>404</h1>
      <h2 style={{ fontSize: '32px', margin: '20px 0', color: '#333' }}>
        Page Not Found
      </h2>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px', maxWidth: '500px' }}>
        Sorry, the page you are looking for does not exist. It might have been moved or deleted.
      </p>
      <Link 
        to="/" 
        style={{
          display: 'inline-block',
          padding: '12px 30px',
          backgroundColor: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: 'var(--button-border-radius)',
          fontSize: 'var(--button-font-size)',
          fontWeight: 'bold',
          transition: 'background-color 0.3s'
        }}
      >
        Go to Home
      </Link>
    </div>
  );
};

export default NotFound;

