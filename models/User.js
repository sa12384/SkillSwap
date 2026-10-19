
const db = require('../config/db');

class User {
    // Find a user by email address
    static async findUserByEmail(email) {
        try {
            const normalizedEmail = email.trim().toLowerCase();

            const user = await db.oneOrNone(
                'SELECT * FROM public.users WHERE LOWER(TRIM(email)) = $1',
                [normalizedEmail]
            );

            return user;
        } catch (error) {
            console.error(
                'Error in findUserByEmail model:',
                error.message
            );
            throw error;
        }
    }

    // Create a new user account
    static async createUser(
        name,
        email,
        hashedPassword,
        bio = '',
        role = 'student'
    ) {
        try {
            const normalizedEmail = email.trim().toLowerCase();

            const query = `
                INSERT INTO public.users
                    (name, email, password, bio, role)
                VALUES
                    ($1, $2, $3, $4, $5)
                RETURNING
                    user_id, name, email, bio, role
            `;

            const newUser = await db.one(query, [
                name.trim(),
                normalizedEmail,
                hashedPassword,
                bio,
                role
            ]);

            return newUser;
        } catch (error) {
            console.error(
                'Error in createUser model:',
                error.message
            );
            throw error;
        }
    }
}

module.exports = User;
