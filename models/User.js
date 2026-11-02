
const pool = require('../config/db');

const User = {
    // Find a user using their email address
    async findUserByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );

        return result.rows[0] || null;
    },

    // Find a user using their ID
    async findUserById(userId) {
        const result = await pool.query(
            `SELECT user_id, name, email, phone_number, bio, role
             FROM users
             WHERE user_id = $1`,
            [userId]
        );

        return result.rows[0] || null;
    },

    // Create a new user with phone number
    async createUser(
        name,
        email,
        hashedPassword,
        bio = '',
        phoneNumber = null,
        role = 'student'
    ) {
        const result = await pool.query(
            `INSERT INTO users
             (name, email, password, bio, phone_number, role)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING user_id, name, email, phone_number, bio, role`,
            [name, email, hashedPassword, bio, phoneNumber, role]
        );

        return result.rows[0];
    },

    // Update user profile including phone number
    async updateUser(userId, name, bio, phoneNumber) {
        const result = await pool.query(
            `UPDATE users
             SET name = $1,
                 bio = $2,
                 phone_number = $3
             WHERE user_id = $4
             RETURNING user_id, name, email, phone_number, bio, role`,
            [name, bio, phoneNumber, userId]
        );

        return result.rows[0] || null;
    },

    // Get all students except the currently logged-in user
    async getAllStudents(currentUserId) {
        const result = await pool.query(
            `SELECT user_id, name, bio, email, phone_number
             FROM users
             WHERE role = 'student'
             AND user_id <> $1
             ORDER BY name`,
            [currentUserId]
        );

        return result.rows;
    }
};

module.exports = User;
