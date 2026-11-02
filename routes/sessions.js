
const express = require('express');
const router = express.Router();

const Session = require('../models/Session');
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all sessions for the logged-in student
router.get('/', authMiddleware, async (req, res) => {
    try {
        const sessions = await Session.getUserSessions(
            req.user.user_id
        );

        return res.status(200).json({ sessions });

    } catch (error) {
        console.error('Get sessions error:', error);

        return res.status(500).json({
            message: 'Could not load sessions.'
        });
    }
});

// Propose a session for an accepted exchange
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            requestId,
            title,
            description,
            sessionDate,
            startTime,
            endTime,
            meetingLocation,
            meetingLink
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

        // Preserve the existing teacher and learner assignments.
        const session = await Session.createSession(
            requestId,
            request.receiver_id,
            request.requester_id,
            title.trim(),
            description || '',
            sessionDate,
            startTime,
            endTime,
            userId,
            meetingLocation || null,
            meetingLink || null
        );

        return res.status(201).json({
            message: 'Session proposal sent successfully.',
            session
        });

    } catch (error) {
        console.error('Schedule session error:', error);

        return res.status(500).json({
            message: 'Could not schedule session.'
        });
    }
});

// Confirm or decline a proposed session
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        const sessionId = Number(req.params.id);
        const userId = Number(req.user.user_id);
        const { status } = req.body;

        if (!Number.isInteger(sessionId) || sessionId <= 0) {
            return res.status(400).json({
                message: 'Invalid session ID.'
            });
        }

        if (!['Confirmed', 'Declined'].includes(status)) {
            return res.status(400).json({
                message: 'Status must be Confirmed or Declined.'
            });
        }

        const session = await Session.updateSessionStatus(
            sessionId,
            userId,
            status
        );

        if (!session) {
            return res.status(404).json({
                message: 'Proposed session not found, or you cannot respond to it.'
            });
        }

        return res.status(200).json({
            message: `Session ${status.toLowerCase()} successfully.`,
            session
        });

    } catch (error) {
        console.error('Update session status error:', error);

        return res.status(500).json({
            message: 'Could not update session status.'
        });
    }
});

module.exports = router;
