
const pool = require('../config/db');

const User = {

    createUser: async (name, email, password, bio, role) => {
        const result = await pool.query(
            `INSERT INTO users (name, email, password, bio, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING user_id, name, email, bio, role`,
            [name, email, password, bio, role]
        );

        return result.rows[0];
    },

    findUserByEmail: async (email) => {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        return result.rows[0];
    },

    findUserById: async (userId) => {
        const result = await pool.query(
            `SELECT user_id, name, email, bio, role
             FROM users
             WHERE user_id = $1`,
            [userId]
        );

        return result.rows[0];
    },

    updateUser: async (userId, name, bio) => {
        const result = await pool.query(
            `UPDATE users
             SET name = $1, bio = $2
             WHERE user_id = $3
             RETURNING user_id, name, email, bio, role`,
            [name, bio, userId]
        );

        return result.rows[0];
    },
    
    getAllStudents: async (currentUserId) => {
    const result = await pool.query(
        `SELECT user_id, name, bio
         FROM users
         WHERE user_id != $1
           AND role = 'student'
         ORDER BY name`,
        [currentUserId]
    );

    return result.rows;
},

};

module.exports = User;
