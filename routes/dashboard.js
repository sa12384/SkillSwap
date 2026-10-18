
const express = require('express');
const router = express.Router();

const pool = require('../config/db');
const ExchangeRequest = require('../models/ExchangeRequest');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `SELECT
                (SELECT COUNT(*)
                 FROM user_skills
                 WHERE user_id = $1
                   AND skill_type = 'teach') AS skills_teach,

                (SELECT COUNT(*)
                 FROM user_skills
                 WHERE user_id = $1
                   AND skill_type = 'learn') AS skills_learn,

                (SELECT COUNT(*)
                 FROM exchange_requests
                 WHERE (requester_id = $1 OR receiver_id = $1)
                   AND status = 'Pending') AS pending_requests`,
            [userId]
        );

        res.json({
            stats: {
                skillsTeach: Number(result.rows[0].skills_teach),
                skillsLearn: Number(result.rows[0].skills_learn),
                pendingRequests: Number(result.rows[0].pending_requests)
            }
        });
    } catch (error) {
        console.error('Dashboard statistics error:', error);
        res.status(500).json({
            message: 'Could not load dashboard statistics.'
        });
    }
});


// GET /api/dashboard/recent-requests
router.get('/recent-requests', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `SELECT
                er.request_id,
                er.status,
                er.requester_id,
                er.receiver_id,
                requester.name AS requester_name,
                receiver.name AS receiver_name,
                offered.skill_name AS offered_skill_name,
                requested.skill_name AS requested_skill_name
             FROM exchange_requests er
             JOIN users requester
                ON er.requester_id = requester.user_id
             JOIN users receiver
                ON er.receiver_id = receiver.user_id
             JOIN skills offered
                ON er.offered_skill = offered.skill_id
             JOIN skills requested
                ON er.requested_skill = requested.skill_id
             WHERE er.requester_id = $1
                OR er.receiver_id = $1
             ORDER BY er.request_id DESC
             LIMIT 5`,
            [userId]
        );

        const requests = result.rows.map(request => {
            const isReceived = Number(request.receiver_id) === Number(userId);

            return {
                requestId: request.request_id,
                name: isReceived
                    ? request.requester_name
                    : request.receiver_name,
                offeredSkill: request.offered_skill_name,
                requestedSkill: request.requested_skill_name,
                status: request.status,
                direction: isReceived ? 'Received' : 'Sent'
            };
        });

        res.status(200).json({ requests });

    } catch (error) {
        console.error('Recent requests error:', error);

        res.status(500).json({
            message: 'Could not load recent requests.'
        });
    }
});

// GET /api/dashboard/recent-requests
router.get('/recent-requests', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const requests =
            await ExchangeRequest.getRecentRequests(userId);

        res.json({ requests });
    } catch (error) {
        console.error('Recent requests error:', error);
        res.status(500).json({
            message: 'Could not load recent requests.'
        });
    }
});

module.exports = router;
