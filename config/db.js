const pgp = require('pg-promise')();
require('dotenv').config();

// Determine if we are running locally or in production on Render
const isProduction = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true';

const db = pgp({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'campus_eats_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'yourpassword',
  // Enforces secure connection parameters natively for Neon Cloud
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

module.exports = db;
