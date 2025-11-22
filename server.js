require('dotenv').config();

const express = require('express');
const cors = require('cors');
require('express-async-errors');

const couponRoutes = require('./src/routes/coupon.routes');
const errorHandler = require('./src/middleware/errorHandler');
const sequelize = require('./src/config/database');
const models = require('./src/models');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/v1', couponRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
  process.exit(1);
});

// Start server
(async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connected');

    const server = app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('✗ Failed to start server:');
    console.error('  Error:', error.message);
    console.error('  Host:', process.env.DB_HOST);
    console.error('  Port:', process.env.DB_PORT);
    console.error('  Database:', process.env.DB_NAME);
    process.exit(1);
  }
})();

module.exports = app;
