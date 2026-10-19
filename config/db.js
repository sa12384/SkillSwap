
require('dotenv').config();

const pgp = require('pg-promise')();

let db;

if (process.env.DATABASE_URL) {
    db = pgp({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
} else {
    db = pgp({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME || 'SkillSwap',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || process.env.DB_PASS,
        ssl: process.env.DB_SSL === 'true'
            ? { rejectUnauthorized: false }
            : false
    });
}

module.exports = db;
