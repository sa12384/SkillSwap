const pgp = require('pg-promise')();
require('dotenv').config();

const db = pgp({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'SkillSwap_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  // This turns on SSL encryption for Neon cloud, but leaves it off for local dev
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

module.exports = db;
