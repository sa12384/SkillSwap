
const db = require('../config/db');

const User = {
    createUser: async (name, email, password, bio, role) => {
        return await db.one(
            `INSERT INTO users (name, email, password, bio, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING user_id, name, email, bio, role`,
            [name, email, password, bio, role]
        );
    },

    findUserByEmail: async (email) => {
        return await db.oneOrNone(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
    },

    findUserById: async (userId) => {
        return await db.oneOrNone(
            `SELECT user_id, name, email, bio, role
             FROM users
             WHERE user_id = $1`,
            [userId]
        );
    },

    updateUser: async (userId, name, bio) => {
        return await db.oneOrNone(
            `UPDATE users
             SET name = $1, bio = $2
             WHERE user_id = $3
             RETURNING user_id, name, email, bio, role`,
            [name, bio, userId]
        );
    },

    getAllStudents: async (currentUserId) => {
        return await db.any(
            `SELECT user_id, name, bio
             FROM users
             WHERE user_id != $1
               AND role = 'student'
             ORDER BY name`,
            [currentUserId]
        );
    }
};

module.exports = User;