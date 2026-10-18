
const pool = require('../config/db');

const Session = {
    // Get sessions for a student
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
                s.status,
                teacher.name AS teacher_name,
                learner.name AS learner_name
             FROM sessions s
             JOIN users teacher
                ON s.teacher_id = teacher.user_id
             JOIN users learner
                ON s.learner_id = learner.user_id
             WHERE s.teacher_id = $1
                OR s.learner_id = $1
             ORDER BY s.session_date, s.start_time`,
            [userId]
        );

        return result.rows;
    },

    // Create a session
    createSession: async (
        requestId,
        teacherId,
        learnerId,
        title,
        description,
        sessionDate,
        startTime,
        endTime
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
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
                'Scheduled'
            ]
        );

        return result.rows[0];
    }
};

module.exports = Session;
