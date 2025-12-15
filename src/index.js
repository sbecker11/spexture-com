import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Suppress harmless browser extension errors in console
window.addEventListener('error', (event) => {
  // Suppress Chrome extension message channel errors
  if (event.message && event.message.includes('message channel closed')) {
    event.preventDefault();
    return false;
  }
});

// Suppress unhandled promise rejections from browser extensions
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('message channel closed')) {
    event.preventDefault();
    return false;
  }
});

// Suppress DOM form warnings (false positives from browser form detection)
const originalWarn = console.warn;
console.warn = function(...args) {
  const message = args.join(' ');
  // Suppress the "Multiple forms" DOM warning - it's a false positive
  if (message.includes('Multiple forms') || message.includes('form elements')) {
    return;
  }
  // Suppress React DevTools download message
  if (message.includes('Download the React DevTools') || message.includes('reactjs.org/link/react-devtools')) {
    return;
  }
  originalWarn.apply(console, args);
};

// Also suppress DOM warnings via error event listener
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('Multiple forms')) {
    event.preventDefault();
    return false;
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
