
const pool = require('../config/db');

const Review = {
    // Get all reviews written about a student.
    async getReviewsForUser(userId) {
        const result = await pool.query(
            `SELECT
                r.review_id,
                r.reviewer_id,
                r.reviewed_user_id,
                r.rating,
                r.comment,
                u.name AS reviewer_name
             FROM reviews r
             JOIN users u ON r.reviewer_id = u.user_id
             WHERE r.reviewed_user_id = $1
             ORDER BY r.review_id DESC`,
            [userId]
        );

        return result.rows;
    },

    // Calculate a student's average rating and review count.
    async getRatingSummary(userId) {
        const result = await pool.query(
            `SELECT
                COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
                    AS average_rating,
                COUNT(*) AS total_reviews
             FROM reviews
             WHERE reviewed_user_id = $1`,
            [userId]
        );

        return {
            average_rating: Number(result.rows[0].average_rating),
            total_reviews: Number(result.rows[0].total_reviews)
        };
    },

    // Check whether two students completed a session together.
    async hasCompletedSession(reviewerId, reviewedUserId) {
        const result = await pool.query(
            `SELECT EXISTS (
                SELECT 1
                FROM sessions
                WHERE LOWER(status) = 'completed'
                AND (
                    (teacher_id = $1 AND learner_id = $2)
                    OR
                    (teacher_id = $2 AND learner_id = $1)
                )
            ) AS eligible`,
            [reviewerId, reviewedUserId]
        );

        return result.rows[0].eligible;
    },

    // Check whether the reviewer has already reviewed this student.
    async hasReviewed(reviewerId, reviewedUserId) {
        const result = await pool.query(
            `SELECT EXISTS (
                SELECT 1
                FROM reviews
                WHERE reviewer_id = $1
                AND reviewed_user_id = $2
            ) AS reviewed`,
            [reviewerId, reviewedUserId]
        );

        return result.rows[0].reviewed;
    },

    // Save a new review.
    async createReview(reviewerId, reviewedUserId, rating, comment) {
        const result = await pool.query(
            `INSERT INTO reviews
                (reviewer_id, reviewed_user_id, rating, comment)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [reviewerId, reviewedUserId, rating, comment]
        );

        return result.rows[0];
    }
};

module.exports = Review;
