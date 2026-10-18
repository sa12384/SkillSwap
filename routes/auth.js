
const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// Register a new user
router.post('/register', authController.register);

// Log in an existing user
router.post('/login', authController.login);

// Get the logged-in user's profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findUserById(req.user.user_id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.error('Profile error:', error.message);

        return res.status(500).json({
            message: 'Could not load profile'
        });
    }
});



router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, bio } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: 'Name is required'
            });
        }

        const user = await User.updateUser(
            req.user.user_id,
            name.trim(),
            bio || ''
        );

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error.message);

        return res.status(500).json({
            message: 'Could not update profile'
        });
    }
});


module.exports = router;
