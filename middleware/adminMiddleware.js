
const pool = require('../config/db');

async function adminMiddleware(req, res, next) {
    try {
        if (!req.user || !req.user.user_id) {
            return res.status(401).json({
                message: 'Authentication required.'
            });
        }

        const result = await pool.query(
            'SELECT role FROM users WHERE user_id = $1',
            [req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'User account not found.'
            });
        }

        if (result.rows[0].role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Use the current database role
        req.user.role = result.rows[0].role;

        next();
    } catch (error) {
        console.error('Admin authorization error:', error);

        return res.status(500).json({
            message: 'Unable to verify administrator access.'
        });
    }
}

module.exports = adminMiddleware;
