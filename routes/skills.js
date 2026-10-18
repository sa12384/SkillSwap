
const express = require('express');
const router = express.Router();

const Skill = require('../models/Skill');
const authMiddleware = require('../middleware/authMiddleware');

// Get all available skills
router.get('/', async (req, res) => {
    try {
        const skills = await Skill.getAllSkills();
        res.status(200).json({ skills });
    } catch (error) {
        console.error('Get skills error:', error.message);
        res.status(500).json({ message: 'Could not load skills' });
    }
});

// Get the logged-in user's skills
router.get('/my-skills', authMiddleware, async (req, res) => {
    try {
        const skills = await Skill.getUserSkills(req.user.user_id);
        res.status(200).json({ skills });
    } catch (error) {
        console.error('Get user skills error:', error.message);
        res.status(500).json({ message: 'Could not load your skills' });
    }
});

// Add a skill to the logged-in user's profile
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { skill_id, skill_type, proficiency } = req.body;

        if (!skill_id || !['teach', 'learn'].includes(skill_type)) {
            return res.status(400).json({
                message: 'Please select a skill and choose teach or learn'
            });
        }

        const allowedLevels = ['Beginner', 'Intermediate', 'Advanced'];

        if (proficiency && !allowedLevels.includes(proficiency)) {
            return res.status(400).json({
                message: 'Please select a valid proficiency level'
            });
        }

        const skill = await Skill.addUserSkill(
            req.user.user_id,
            skill_id,
            skill_type,
            proficiency || 'Beginner'
        );

        res.status(201).json({
            message: 'Skill added successfully',
            skill
        });
    } catch (error) {
        console.error('Add skill error:', error.message);
        res.status(500).json({ message: 'Could not add skill' });
    }
});

// Remove a skill from the logged-in user's profile
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const removed = await Skill.removeUserSkill(
            req.user.user_id,
            req.params.id
        );

        if (!removed) {
            return res.status(404).json({
                message: 'Skill not found in your profile'
            });
        }

        res.status(200).json({ message: 'Skill removed successfully' });
    } catch (error) {
        console.error('Remove skill error:', error.message);
        res.status(500).json({ message: 'Could not remove skill' });
    }
});

module.exports = router;
