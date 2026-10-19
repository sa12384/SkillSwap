const pool = require('../config/db');

const User = {
    async findUserByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        return result.rows[0] || null;
    },

    async findUserById(userId) {
        const result = await pool.query(
            'SELECT user_id, name, email, bio, role FROM users WHERE user_id = $1', [userId]);
        return result.rows[0] || null;
    },

    async createUser(name, email, hashedPassword, bio = '', role = 'student') {
        const result = await pool.query(
            `INSERT INTO users (name, email, password, bio, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING user_id, name, email, bio, role`,
            [name, email, hashedPassword, bio, role]);
        return result.rows[0];
    },

    async updateUser(userId, name, bio) {
        const result = await pool.query(
            `UPDATE users SET name = $1, bio = $2 WHERE user_id = $3
             RETURNING user_id, name, email, bio, role`,
            [name, bio, userId]);
        return result.rows[0] || null;
    },

    async getAllStudents(currentUserId) {
        const result = await pool.query(
            `SELECT user_id, name, bio FROM users
             WHERE role = 'student' AND user_id <> $1
             ORDER BY name`, [currentUserId]);
        return result.rows;
    }
};

module.exports = User;