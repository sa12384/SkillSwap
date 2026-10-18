
const express = require('express');
const router = express.Router();

const pool = require('../config/db');
const ExchangeRequest = require('../models/ExchangeRequest');
const authMiddleware = require('../middleware/authMiddleware');

// Send a new exchange request
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { receiver_id, offered_skill, requested_skill } = req.body;
        const requesterId = req.user.user_id;

        if (!receiver_id || !offered_skill || !requested_skill) {
            return res.status(400).json({
                message: 'Please provide the receiver and both skills.'
            });
        }

        if (
            Number(receiver_id) === Number(requesterId) ||
            Number(offered_skill) <= 0 ||
            Number(requested_skill) <= 0 ||
            Number(offered_skill) === Number(requested_skill)
        ) {
            return res.status(400).json({
                message: 'Please select another student and two different valid skills.'
            });
        }

        const request = await ExchangeRequest.createRequest(
            requesterId,
            Number(receiver_id),
            Number(offered_skill),
            Number(requested_skill)
        );

        return res.status(201).json({
            message: 'Exchange request sent successfully.',
            request
        });
    } catch (error) {
        console.error('Send exchange request error:', error);
        return res.status(500).json({
            message: 'Could not send exchange request.'
        });
    }
});

// View requests received by the logged-in student
router.get('/received', authMiddleware, async (req, res) => {
    try {
        const requests = await ExchangeRequest.getReceivedRequests(
            req.user.user_id
        );

        return res.status(200).json({ requests });
    } catch (error) {
        console.error('Get received requests error:', error);
        return res.status(500).json({
            message: 'Could not load received requests.'
        });
    }
});

// View requests sent by the logged-in student
router.get('/sent', authMiddleware, async (req, res) => {
    try {
        const requests = await ExchangeRequest.getSentRequests(
            req.user.user_id
        );

        return res.status(200).json({ requests });
    } catch (error) {
        console.error('Get sent requests error:', error);
        return res.status(500).json({
            message: 'Could not load sent requests.'
        });
    }
});

// Accept or reject a request received by the logged-in student
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['Accepted', 'Rejected'].includes(status)) {
            return res.status(400).json({
                message: 'Status must be Accepted or Rejected.'
            });
        }

        const request = await ExchangeRequest.updateStatus(
            Number(req.params.id),
            req.user.user_id,
            status
        );

        if (!request) {
            return res.status(404).json({
                message: 'Pending request not found.'
            });
        }

        return res.status(200).json({
            message: `Request ${status.toLowerCase()} successfully.`,
            request
        });
    } catch (error) {
        console.error('Update exchange request error:', error);
        return res.status(500).json({
            message: 'Could not update request status.'
        });
    }
});


router.get('/accepted', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `SELECT
                er.request_id,
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
             WHERE er.status = 'Accepted'
               AND (er.requester_id = $1 OR er.receiver_id = $1)
             ORDER BY er.request_id DESC`,
            [userId]
        );

        res.status(200).json({
            requests: result.rows
        });
    } catch (error) {
        console.error('Accepted requests error:', error);

        res.status(500).json({
            message: 'Could not load accepted exchange requests.'
        });
    }
});


module.exports = router;
