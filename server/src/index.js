const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from project root (.env file)
// Try project root first, then fall back to server directory
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') }); // Fallback to server/.env if exists

const app = express();
// PORT is set by docker-compose from SPEXTURE_SERVER_PORT
// For direct runs, use SPEXTURE_SERVER_PORT
const PORT = process.env.PORT || process.env.SPEXTURE_SERVER_PORT || 3011;

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const coverageRoutes = require('./routes/coverage');

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CLIENT_URL || process.env.SPEXTURE_CLIENT_URL || `http://localhost:${process.env.SPEXTURE_CLIENT_PORT || 3010}`,
  credentials: true
}));
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coverage', coverageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...((process.env.NODE_ENV || process.env.SPEXTURE_NODE_ENV) === 'development' && { stack: err.stack })
  });
});

// Start server only if not in test environment
if ((process.env.NODE_ENV || process.env.SPEXTURE_NODE_ENV) !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || process.env.SPEXTURE_NODE_ENV || 'development'}`);
  });
}

module.exports = app;

