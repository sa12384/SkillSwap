
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register a new student
exports.register = async (req, res) => {
    try {
        const { name, email, password, bio } = req.body;

        // Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email and password are required'
            });
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Check password length
        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long'
            });
        }

        // Check whether the email already exists
        const existingUser = await User.findUserByEmail(
            normalizedEmail
        );

        if (existingUser) {
            return res.status(409).json({
                message: 'Email already exists'
            });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the account with the student role
        const user = await User.createUser(
            name,
            normalizedEmail,
            hashedPassword,
            bio || '',
            'student'
        );

        return res.status(201).json({
            message: 'User registered successfully',
            user
        });

    } catch (error) {
        console.error('Registration error:', error.message);

        // Handle duplicate email errors from the database
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Email already exists'
            });
        }

        return res.status(500).json({
            message: 'Registration failed'
        });
    }
};


// Log in an existing user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Find the user in the database
        const user = await User.findUserByEmail(
            normalizedEmail
        );

        // Use the same message for an unknown email or wrong password
        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Check whether the stored password is a bcrypt hash
        if (
            typeof user.password !== 'string' ||
            !user.password.startsWith('$2')
        ) {
            console.error(
                'Login failed: stored password is not a bcrypt hash.'
            );

            return res.status(401).json({
                message: 'Invalid email or password. Please reset your password or register again.'
            });
        }

        // Compare the entered password with the stored hash
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Ensure JWT secret is configured
        if (!process.env.JWT_SECRET) {
            console.error(
                'JWT_SECRET is missing from the environment.'
            );

            return res.status(500).json({
                message: 'Server authentication is not configured.'
            });
        }

        // Generate a login token
        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        // Send the token and safe user details
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);

        return res.status(500).json({
            message: 'Login failed'
        });
    }
};
