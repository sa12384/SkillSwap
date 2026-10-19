const { Pool } = require('pg');
require('dotenv').config();

const password = process.env.DB_PASSWORD || process.env.DB_PASS;

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${encodeURIComponent(process.env.DB_USER || '')}:${encodeURIComponent(password || '')}` +
  `@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

// Hosted databases need SSL. Set DB_SSL=false to turn it off.
const useSsl =
  process.env.DB_SSL ? process.env.DB_SSL === 'true' : !!process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => console.error('Unexpected database error:', err.message));

module.exports = pool;