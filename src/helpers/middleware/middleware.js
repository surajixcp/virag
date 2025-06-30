const Block = require('../../models/Block.model');

/**
 * Middleware to check if a block relationship exists between users.
 * Prevents access if either user has blocked the other.
 *
 * @param {Object} req - Express request object (expects `req.user.id` and `targetUserId`)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const blockCheck = async (req, res, next) => {
    try {
        const { targetUserId } = req.body; // Adjust if using req.params or req.query
        const blockerId = req.user.id;

        if (!targetUserId) {
            return res.status(400).json({ message: 'Target user ID is required.' });
        }

        const existingBlock = await Block.findOne({
            isBlocked: true,
            $or: [
                { blocker: blockerId, blocked: targetUserId },
                { blocker: targetUserId, blocked: blockerId }
            ]
        });

        if (existingBlock) {
            return res.status(403).json({
                success: false,
                message: 'Access denied due to block relationship.'
            });
        }

        next();
    } catch (error) {
        console.error('Block check error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

module.exports = { blockCheck };
