
const pool = require('../config/db');

const ExchangeRequest = {
    // Create a new exchange request
    createRequest: async (
        requesterId,
        receiverId,
        offeredSkill,
        requestedSkill
    ) => {
        const result = await pool.query(
            `INSERT INTO exchange_requests
                (requester_id, receiver_id, offered_skill, requested_skill)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [requesterId, receiverId, offeredSkill, requestedSkill]
        );

        return result.rows[0];
    },

    // Get requests received by the logged-in student
    getReceivedRequests: async (userId) => {
        const result = await pool.query(
            `SELECT er.*,
                    requester.name AS requester_name,
                    offered.skill_name AS offered_skill_name,
                    requested.skill_name AS requested_skill_name
             FROM exchange_requests er
             JOIN users requester
               ON er.requester_id = requester.user_id
             JOIN skills offered
               ON er.offered_skill = offered.skill_id
             JOIN skills requested
               ON er.requested_skill = requested.skill_id
             WHERE er.receiver_id = $1
             ORDER BY er.request_id DESC`,
            [userId]
        );

        return result.rows;
    },

    // Get requests sent by the logged-in student
    getSentRequests: async (userId) => {
        const result = await pool.query(
            `SELECT er.*,
                    receiver.name AS receiver_name,
                    offered.skill_name AS offered_skill_name,
                    requested.skill_name AS requested_skill_name
             FROM exchange_requests er
             JOIN users receiver
               ON er.receiver_id = receiver.user_id
             JOIN skills offered
               ON er.offered_skill = offered.skill_id
             JOIN skills requested
               ON er.requested_skill = requested.skill_id
             WHERE er.requester_id = $1
             ORDER BY er.request_id DESC`,
            [userId]
        );

        return result.rows;
    },

    // Get recent requests involving the logged-in student
    getRecentRequests: async (userId) => {
        const result = await pool.query(
            `SELECT
                er.request_id,
                er.status,
                er.requester_id,
                er.receiver_id,
                er.offered_skill,
                er.requested_skill,
                er.created_at,
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

        return result.rows;
    },

    // Accept or reject a pending request
    updateStatus: async (requestId, receiverId, status) => {
        const result = await pool.query(
            `UPDATE exchange_requests
             SET status = $1
             WHERE request_id = $2
               AND receiver_id = $3
               AND status = 'Pending'
             RETURNING *`,
            [status, requestId, receiverId]
        );

        return result.rows[0];
    }
};

module.exports = ExchangeRequest;
