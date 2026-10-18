
const express = require('express');
const router = express.Router();

const Session = require('../models/Session');
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all sessions for the logged-in student
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const sessions = await Session.getUserSessions(userId);

        res.status(200).json({ sessions });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            message: 'Could not load sessions.'
        });
    }
});

// Schedule a session for an accepted exchange request
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            requestId,
            title,
            description,
            sessionDate,
            startTime,
            endTime
        } = req.body;

        if (
            !requestId ||
            !title ||
            !sessionDate ||
            !startTime ||
            !endTime
        ) {
            return res.status(400).json({
                message: 'Please fill in all required fields.'
            });
        }

        if (startTime >= endTime) {
            return res.status(400).json({
                message: 'End time must be later than start time.'
            });
        }

        // Find the exchange request and check that it was accepted
        const result = await pool.query(
            `SELECT requester_id, receiver_id, status
             FROM exchange_requests
             WHERE request_id = $1`,
            [requestId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Exchange request not found.'
            });
        }

        const request = result.rows[0];
        const userId = Number(req.user.user_id);

        if (
            Number(request.requester_id) !== userId &&
            Number(request.receiver_id) !== userId
        ) {
            return res.status(403).json({
                message: 'You cannot schedule a session for this request.'
            });
        }

        if (request.status !== 'Accepted') {
            return res.status(400).json({
                message: 'Only accepted exchange requests can be scheduled.'
            });
        }

        // The requester is the learner; the receiver is the teacher
        const session = await Session.createSession(
            requestId,
            request.receiver_id,
            request.requester_id,
            title.trim(),
            description || '',
            sessionDate,
            startTime,
            endTime
        );

        res.status(201).json({
            message: 'Session scheduled successfully.',
            session
        });
    } catch (error) {
        console.error('Schedule session error:', error);
        res.status(500).json({
            message: 'Could not schedule session.'
        });
    }
});

module.exports = router;
