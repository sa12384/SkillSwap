
const express = require('express');
const router = express.Router();

const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/students
router.get('/', authMiddleware, async (req, res) => {
    try {
        const students = await User.getAllStudents(
            req.user.user_id
        );

        res.status(200).json({ students });
    } catch (error) {
        console.error('Error finding students:', error);
        res.status(500).json({
            message: 'Could not load students.'
        });
    }
});

module.exports = router;
