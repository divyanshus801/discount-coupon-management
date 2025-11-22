require('dotenv').config();
const sequelize = require('../config/database');

// Initialize database tables
async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Authenticate connection
    await sequelize.authenticate();
    console.log('✓ Database connection verified');

    // Sync all models with database
    await sequelize.sync({ alter: false, force: false });

    console.log('✓ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
