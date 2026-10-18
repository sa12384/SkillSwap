const db = require('../config/db');

class User {
    // 1. Method to find an existing profile by email address
    static async findUserByEmail(email) {
        try {
            // Adjust the column name 'email' if your database uses a different name
            const user = await db.oneOrNone('SELECT * FROM public.users WHERE email = \$1', [email]);
            return user;
        } catch (error) {
            console.error('Error in findUserByEmail model:', error.message);
            throw error;
        }
    }

    // 2. Method to insert a new user profile upon registration
    static async createUser(name, email, hashedPassword, bio = '', role = 'student') {
        try {
            const query = `
                INSERT INTO public.users (name, email, password, bio, role)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING user_id, name, email, bio, role
            `;
            const newUser = await db.one(query, [name, email, hashedPassword, bio, role]);
            return newUser;
        } catch (error) {
            console.error('Error in createUser model:', error.message);
            throw error;
        }
    }
}

module.exports = User;
