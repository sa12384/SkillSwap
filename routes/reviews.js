
const express = require('express');
const router = express.Router();

const Review = require('../models/Review');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/reviews/user/:userId
// Get reviews and average rating for a student.
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        if (!Number.isInteger(userId) || userId < 1) {
            return res.status(400).json({
                message: 'Invalid student ID.'
            });
        }

        const [reviews, summary] = await Promise.all([
            Review.getReviewsForUser(userId),
            Review.getRatingSummary(userId)
        ]);

        res.json({ reviews, summary });
    } catch (error) {
        console.error('Error loading reviews:', error);
        res.status(500).json({
            message: 'Could not load reviews.'
        });
    }
});

// POST /api/reviews
// Submit a review for a student after a completed session.
router.post('/', authMiddleware, async (req, res) => {
    try {
        const reviewerId = Number(req.user.user_id);
        const reviewedUserId = Number(req.body.reviewed_user_id);
        const rating = Number(req.body.rating);
        const comment = String(req.body.comment || '').trim();

        if (
            !Number.isInteger(reviewedUserId) ||
            reviewedUserId < 1
        ) {
            return res.status(400).json({
                message: 'Invalid student ID.'
            });
        }

        if (reviewedUserId === reviewerId) {
            return res.status(400).json({
                message: 'You cannot review yourself.'
            });
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                message: 'Rating must be between 1 and 5.'
            });
        }

        if (comment.length > 1000) {
            return res.status(400).json({
                message: 'Review must be 1000 characters or fewer.'
            });
        }

        const eligible = await Review.hasCompletedSession(
            reviewerId,
            reviewedUserId
        );

        if (!eligible) {
            return res.status(403).json({
                message: 'You can review a student only after completing a session together.'
            });
        }

        const alreadyReviewed = await Review.hasReviewed(
            reviewerId,
            reviewedUserId
        );

        if (alreadyReviewed) {
            return res.status(409).json({
                message: 'You have already reviewed this student.'
            });
        }

        const review = await Review.createReview(
            reviewerId,
            reviewedUserId,
            rating,
            comment
        );

        res.status(201).json({
            message: 'Review submitted successfully.',
            review
        });
    } catch (error) {
        console.error('Error submitting review:', error);

        // PostgreSQL unique-constraint violation, if configured.
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'You have already submitted this review.'
            });
        }

        res.status(500).json({
            message: 'Could not submit review.'
        });
    }
});

module.exports = router;
