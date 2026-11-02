
const pool = require('../config/db');

const Session = {

    // Get all sessions belonging to a student
    getUserSessions: async (userId) => {
        const result = await pool.query(
            `SELECT
                s.session_id,
                s.request_id,
                s.teacher_id,
                s.learner_id,
                s.title,
                s.description,
                s.session_date,
                s.start_time,
                s.end_time,
                s.meeting_location,
                s.meeting_link,
                s.proposed_by,
                s.status,
                teacher.name AS teacher_name,
                learner.name AS learner_name,
                proposer.name AS proposer_name
             FROM sessions s
             JOIN users teacher
                ON s.teacher_id = teacher.user_id
             JOIN users learner
                ON s.learner_id = learner.user_id
             LEFT JOIN users proposer
                ON s.proposed_by = proposer.user_id
             WHERE s.teacher_id = $1
                OR s.learner_id = $1
             ORDER BY s.session_date, s.start_time`,
            [userId]
        );

        return result.rows;
    },

    // Create a proposed session
    createSession: async (
        requestId,
        teacherId,
        learnerId,
        title,
        description,
        sessionDate,
        startTime,
        endTime,
        proposedBy,
        meetingLocation,
        meetingLink
    ) => {
        const result = await pool.query(
            `INSERT INTO sessions (
                request_id,
                teacher_id,
                learner_id,
                title,
                description,
                session_date,
                start_time,
                end_time,
                proposed_by,
                meeting_location,
                meeting_link,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                requestId,
                teacherId,
                learnerId,
                title,
                description,
                sessionDate,
                startTime,
                endTime,
                proposedBy,
                meetingLocation,
                meetingLink,
                'Proposed'
            ]
        );

        return result.rows[0];
    },

    // Confirm or decline a proposed session
    updateSessionStatus: async (sessionId, userId, status) => {
        const result = await pool.query(
            `UPDATE sessions
             SET status = $1
             WHERE session_id = $2
               AND status = 'Proposed'
               AND (
                   teacher_id = $3
                   OR learner_id = $3
               )
               AND proposed_by <> $3
             RETURNING *`,
            [status, sessionId, userId]
        );

        return result.rows[0] || null;
    }

};

module.exports = Session;
