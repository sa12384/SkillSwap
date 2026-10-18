
const express = require('express');
const router = express.Router();

const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// All endpoints below require a valid login and admin role.
router.use(authMiddleware, adminMiddleware);

// ------------------------------------
// 1. DASHBOARD STATISTICS
// GET /api/admin/stats
// ------------------------------------
router.get('/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users) AS total_users,
                (SELECT COUNT(*) FROM users
                    WHERE role = 'student') AS total_students,
                (SELECT COUNT(*) FROM skills) AS total_skills,
                (SELECT COUNT(*) FROM user_skills) AS user_skill_listings,
                (SELECT COUNT(*) FROM exchange_requests) AS total_requests,
                (SELECT COUNT(*) FROM exchange_requests
                    WHERE LOWER(status) = 'pending') AS pending_requests,
                (SELECT COUNT(*) FROM exchange_requests
                    WHERE LOWER(status) = 'accepted') AS accepted_requests,
                (SELECT COUNT(*) FROM exchange_requests
                    WHERE LOWER(status) = 'rejected') AS rejected_requests,
                (SELECT COUNT(*) FROM exchange_requests
                    WHERE LOWER(status) = 'completed') AS completed_requests,
                (SELECT COUNT(*) FROM sessions) AS total_sessions,
                (SELECT COUNT(*) FROM reviews) AS total_reviews,
                (SELECT COUNT(*) FROM categories) AS total_categories
        `);

        const stats = {};

        for (const [key, value] of Object.entries(result.rows[0])) {
            stats[key] = Number(value);
        }

        res.json({ stats });
    } catch (error) {
        console.error('Stats error:', error.message);
        res.status(500).json({
            message: 'Could not load dashboard statistics.'
        });
    }
});

// ------------------------------------
// 2. USER MANAGEMENT
// GET /api/admin/users?search=...
// ------------------------------------
router.get('/users', async (req, res) => {
    try {
        const search = String(req.query.search || '').trim();

        const result = await pool.query(`
            SELECT
                u.user_id,
                u.name,
                u.email,
                u.bio,
                u.role,
                COUNT(DISTINCT us.user_skill_id)::int AS skill_count
            FROM users u
            LEFT JOIN user_skills us ON us.user_id = u.user_id
            WHERE (
                $1 = ''
                OR u.name ILIKE '%' || $1 || '%'
                OR u.email ILIKE '%' || $1 || '%'
            )
            GROUP BY u.user_id
            ORDER BY u.user_id DESC
            LIMIT 200
        `, [search]);

        res.json({ users: result.rows });
    } catch (error) {
        console.error('Users error:', error.message);
        res.status(500).json({
            message: 'Could not load users.'
        });
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
    const userId = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(userId) || userId < 1) {
        return res.status(400).json({
            message: 'Invalid user ID.'
        });
    }

    if (userId === Number(req.user.user_id)) {
        return res.status(400).json({
            message: 'You cannot delete your own account.'
        });
    }

    try {
        const target = await pool.query(
            'SELECT role FROM users WHERE user_id = $1',
            [userId]
        );

        if (target.rowCount === 0) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        if (target.rows[0].role === 'admin') {
            return res.status(403).json({
                message: 'You cannot delete another admin account here.'
            });
        }

        await pool.query(
            'DELETE FROM users WHERE user_id = $1',
            [userId]
        );

        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Delete user error:', error.message);

        if (error.code === '23503') {
            return res.status(409).json({
                message: 'This user has related records that prevent deletion. Review related sessions and other records first.'
            });
        }

        res.status(500).json({
            message: 'Could not delete user.'
        });
    }
});

// ------------------------------------
// 3. EXCHANGE-REQUEST MANAGEMENT
// GET /api/admin/requests
// ------------------------------------
router.get('/requests', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                er.request_id,
                er.status,
                requester.name AS requester_name,
                receiver.name AS receiver_name,
                offered.skill_name AS offered_skill_name,
                wanted.skill_name AS requested_skill_name
            FROM exchange_requests er
            LEFT JOIN users requester
                ON requester.user_id = er.requester_id
            LEFT JOIN users receiver
                ON receiver.user_id = er.receiver_id
            LEFT JOIN skills offered
                ON offered.skill_id = er.offered_skill
            LEFT JOIN skills wanted
                ON wanted.skill_id = er.requested_skill
            ORDER BY er.request_id DESC
            LIMIT 200
        `);

        res.json({ requests: result.rows });
    } catch (error) {
        console.error('Requests error:', error.message);
        res.status(500).json({
            message: 'Could not load exchange requests.'
        });
    }
});

// PATCH /api/admin/requests/:id/status
router.patch('/requests/:id/status', async (req, res) => {
    const requestId = Number.parseInt(req.params.id, 10);
    const allowedStatuses = [
        'Pending',
        'Accepted',
        'Rejected',
        'Completed'
    ];

    const status = allowedStatuses.find(
        item => item.toLowerCase() ===
            String(req.body.status || '').toLowerCase()
    );

    if (!Number.isInteger(requestId) || requestId < 1) {
        return res.status(400).json({
            message: 'Invalid request ID.'
        });
    }

    if (!status) {
        return res.status(400).json({
            message: 'Status must be Pending, Accepted, Rejected, or Completed.'
        });
    }

    try {
        const result = await pool.query(
            `UPDATE exchange_requests
             SET status = $1
             WHERE request_id = $2
             RETURNING request_id, status`,
            [status, requestId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Exchange request not found.'
            });
        }

        res.json({
            message: 'Exchange-request status updated.',
            request: result.rows[0]
        });
    } catch (error) {
        console.error('Update request error:', error.message);
        res.status(500).json({
            message: 'Could not update request status.'
        });
    }
});

// ------------------------------------
// 4. SKILL MANAGEMENT
// GET /api/admin/skills
// ------------------------------------
router.get('/skills', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                s.skill_id,
                s.skill_name,
                s.category_id,
                c.name AS category_name,
                COUNT(DISTINCT us.user_skill_id)::int AS listing_count
            FROM skills s
            LEFT JOIN categories c
                ON c.category_id = s.category_id
            LEFT JOIN user_skills us
                ON us.skill_id = s.skill_id
            GROUP BY s.skill_id, c.name
            ORDER BY s.skill_name ASC
        `);

        res.json({ skills: result.rows });
    } catch (error) {
        console.error('Skills error:', error.message);
        res.status(500).json({
            message: 'Could not load skills.'
        });
    }
});

// POST /api/admin/skills
router.post('/skills', async (req, res) => {
    const skillName = String(req.body.skill_name || '').trim();
    const categoryId = req.body.category_id;

    if (!skillName) {
        return res.status(400).json({
            message: 'Skill name is required.'
        });
    }

    if (skillName.length > 100) {
        return res.status(400).json({
            message: 'Skill name must be 100 characters or fewer.'
        });
    }

    try {
        let result;

        if (categoryId === '' || categoryId === null ||
            categoryId === undefined) {
            result = await pool.query(
                `INSERT INTO skills (skill_name, category_id)
                 VALUES ($1, NULL)
                 RETURNING skill_id, skill_name, category_id`,
                [skillName]
            );
        } else {
            const id = Number(categoryId);

            if (!Number.isInteger(id) || id < 1) {
                return res.status(400).json({
                    message: 'Invalid category.'
                });
            }

            result = await pool.query(
                `INSERT INTO skills (skill_name, category_id)
                 VALUES ($1, $2)
                 RETURNING skill_id, skill_name, category_id`,
                [skillName, id]
            );
        }

        res.status(201).json({
            message: 'Skill created successfully.',
            skill: result.rows[0]
        });
    } catch (error) {
        console.error('Create skill error:', error.message);

        if (error.code === '23503') {
            return res.status(400).json({
                message: 'The selected category does not exist.'
            });
        }

        if (error.code === '23505') {
            return res.status(409).json({
                message: 'This skill may already exist.'
            });
        }

        res.status(500).json({
            message: 'Could not create skill.'
        });
    }
});

// PUT /api/admin/skills/:id
router.put('/skills/:id', async (req, res) => {
    const skillId = Number.parseInt(req.params.id, 10);
    const skillName = String(req.body.skill_name || '').trim();
    const categoryId = req.body.category_id;

    if (!Number.isInteger(skillId) || skillId < 1) {
        return res.status(400).json({
            message: 'Invalid skill ID.'
        });
    }

    if (!skillName || skillName.length > 100) {
        return res.status(400).json({
            message: 'Enter a skill name of 1 to 100 characters.'
        });
    }

    try {
        let result;

        if (categoryId === '' || categoryId === null ||
            categoryId === undefined) {
            result = await pool.query(
                `UPDATE skills
                 SET skill_name = $1, category_id = NULL
                 WHERE skill_id = $2
                 RETURNING skill_id, skill_name, category_id`,
                [skillName, skillId]
            );
        } else {
            const id = Number(categoryId);

            if (!Number.isInteger(id) || id < 1) {
                return res.status(400).json({
                    message: 'Invalid category.'
                });
            }

            result = await pool.query(
                `UPDATE skills
                 SET skill_name = $1, category_id = $2
                 WHERE skill_id = $3
                 RETURNING skill_id, skill_name, category_id`,
                [skillName, id, skillId]
            );
        }

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Skill not found.'
            });
        }

        res.json({
            message: 'Skill updated successfully.',
            skill: result.rows[0]
        });
    } catch (error) {
        console.error('Update skill error:', error.message);

        if (error.code === '23503') {
            return res.status(400).json({
                message: 'The selected category does not exist.'
            });
        }

        res.status(500).json({
            message: 'Could not update skill.'
        });
    }
});

// DELETE /api/admin/skills/:id
router.delete('/skills/:id', async (req, res) => {
    const skillId = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(skillId) || skillId < 1) {
        return res.status(400).json({
            message: 'Invalid skill ID.'
        });
    }

    try {
        const result = await pool.query(
            'DELETE FROM skills WHERE skill_id = $1 RETURNING skill_id',
            [skillId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Skill not found.'
            });
        }

        res.json({ message: 'Skill deleted successfully.' });
    } catch (error) {
        console.error('Delete skill error:', error.message);

        if (error.code === '23503') {
            return res.status(409).json({
                message: 'This skill is being used in student listings or exchange requests. Remove or reassign those references before deleting it.'
            });
        }

        res.status(500).json({
            message: 'Could not delete skill.'
        });
    }
});

// ------------------------------------
// 5. CATEGORY MANAGEMENT
// GET /api/admin/categories
// ------------------------------------
router.get('/categories', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                c.category_id,
                c.name,
                COUNT(DISTINCT s.skill_id)::int AS skill_count
            FROM categories c
            LEFT JOIN skills s ON s.category_id = c.category_id
            GROUP BY c.category_id
            ORDER BY c.name ASC
        `);

        res.json({ categories: result.rows });
    } catch (error) {
        console.error('Categories error:', error.message);
        res.status(500).json({
            message: 'Could not load categories.'
        });
    }
});

// POST /api/admin/categories
router.post('/categories', async (req, res) => {
    const name = String(req.body.name || '').trim();

    if (!name || name.length > 100) {
        return res.status(400).json({
            message: 'Enter a category name of 1 to 100 characters.'
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO categories (name)
             VALUES ($1)
             RETURNING category_id, name`,
            [name]
        );

        res.status(201).json({
            message: 'Category created successfully.',
            category: result.rows[0]
        });
    } catch (error) {
        console.error('Create category error:', error.message);

        if (error.code === '23505') {
            return res.status(409).json({
                message: 'That category already exists.'
            });
        }

        res.status(500).json({
            message: 'Could not create category.'
        });
    }
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', async (req, res) => {
    const categoryId = Number.parseInt(req.params.id, 10);
    const name = String(req.body.name || '').trim();

    if (!Number.isInteger(categoryId) || categoryId < 1) {
        return res.status(400).json({
            message: 'Invalid category ID.'
        });
    }

    if (!name || name.length > 100) {
        return res.status(400).json({
            message: 'Enter a category name of 1 to 100 characters.'
        });
    }

    try {
        const result = await pool.query(
            `UPDATE categories
             SET name = $1
             WHERE category_id = $2
             RETURNING category_id, name`,
            [name, categoryId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Category not found.'
            });
        }

        res.json({
            message: 'Category updated successfully.',
            category: result.rows[0]
        });
    } catch (error) {
        console.error('Update category error:', error.message);

        if (error.code === '23505') {
            return res.status(409).json({
                message: 'That category name already exists.'
            });
        }

        res.status(500).json({
            message: 'Could not update category.'
        });
    }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', async (req, res) => {
    const categoryId = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(categoryId) || categoryId < 1) {
        return res.status(400).json({
            message: 'Invalid category ID.'
        });
    }

    try {
        // Do not delete a category while skills still use it.
        const used = await pool.query(
            'SELECT 1 FROM skills WHERE category_id = $1 LIMIT 1',
            [categoryId]
        );

        if (used.rowCount > 0) {
            return res.status(409).json({
                message: 'Move or delete the skills in this category before deleting the category.'
            });
        }

        const result = await pool.query(
            `DELETE FROM categories
             WHERE category_id = $1
             RETURNING category_id`,
            [categoryId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Category not found.'
            });
        }

        res.json({ message: 'Category deleted successfully.' });
    } catch (error) {
        console.error('Delete category error:', error.message);
        res.status(500).json({
            message: 'Could not delete category.'
        });
    }
});

module.exports = router;
