/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */

const createError = require('http-errors');
const mongoose = require('mongoose');
const Model = require('../models/Block.model'); // Assuming block.model.js file
const { ADMIN_SERVICE_WELCOME_MSG } = require('../helpers/resource/constants');

const ModuleName = 'Block';

module.exports = {
    getInfo: async (req, res) => res.status(200).json({ message: `${ADMIN_SERVICE_WELCOME_MSG(ModuleName)} Info Route Working` }),

    /**
     * Create or update block entry
     */
    create: async (req, res, next) => {
        try {
            const { blocked, reason } = req.body;
            const blocker = req.user.id;
            console.log("blocker", blocker);
            if (!blocked || blocker === blocked) {
                return next(createError.BadRequest('Invalid block request.'));
            }

            const data = {
                blocker,
                blocked,
                reason,
                isBlocked: true,
                blockedAt: new Date(),
                unblockedAt: null,
                updated_by: req.user.mobile || 'unauth',
                created_by: req.user.mobile || 'unauth',
                created_at: new Date(),
                updated_at: new Date(),
            };

            const result = await Model.findOneAndUpdate(
                { blocker, blocked },
                { $set: data },
                { upsert: true, new: true }
            );

            return res.status(200).json({
                success: true,
                status: 200,
                message: 'User blocked successfully',
                data: result,
            });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Unblock user by updating the block record
     */
    updateById: async (req, res, next) => {
        try {
            const { _id } = req.body;
            const found = await Model.findOne({ _id });
            if (!found) {
                return next(createError.NotFound('Block record not found'));
            }
            found.isBlocked = false;
            found.unblockedAt = new Date();
            found.updated_at = new Date();
            found.updated_by = req.user ? req.user.mobile : 'unauth';
            await found.save();
            return res.status(200).json({ success: true, status: 200, message: 'User unblocked successfully' });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get list of all blocked users
     */
    getList: async (req, res, next) => {
        try {
            const { page, limit, sort } = req.query;
            const _page = page ? Number(page) : 1;
            const _limit = limit ? Number(limit) : 20;
            const _skip = (_page - 1) * _limit;
            const _sort = sort || 'blockedAt';

            const query = { isBlocked: true, blocker: mongoose.Types.ObjectId(req.user.id) };

            const list = await Model.aggregate([
                { $match: query },
                { $sort: { [_sort]: -1 } },
                { $skip: _skip },
                { $limit: _limit },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'blocked',
                        foreignField: '_id',
                        as: 'blockedUser'
                    }
                },
                {
                    $unwind: {
                        path: '$blockedUser',
                        preserveNullAndEmptyArrays: true
                    }
                }
            ]);

            const resultCount = await Model.countDocuments(query);

            return res.status(200).json({
                success: true,
                message: 'Blocked user list fetched',
                status: 200,
                data: list,
                meta: {
                    current_page: _page,
                    from: _skip + 1,
                    last_page: Math.ceil(resultCount / _limit),
                    per_page: _limit,
                    to: _skip + list.length,
                    total: resultCount
                },
            });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get specific block record by ID
     */
    getDataById: async (req, res, next) => {
        try {
            const { id } = req.query;
            if (!id) throw createError.BadRequest('Invalid Parameters');

            const result = await Model.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(id) } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'blocked',
                        foreignField: '_id',
                        as: 'blockedUser'
                    }
                },
                { $unwind: { path: '$blockedUser', preserveNullAndEmptyArrays: true } }
            ]);

            if (!result.length) throw createError.NotFound('No block entry found');

            return res.status(200).json({
                success: true,
                status: 200,
                message: 'Block detail fetched',
                data: result[0],
            });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Mark block entry as inactive (soft delete)
     */
    deleteDataById: async (req, res, next) => {
        try {
            const { id } = req.query;
            if (!id) throw createError.BadRequest('Invalid Parameters');

            const result = await Model.findByIdAndUpdate(id, {
                $set: {
                    isBlocked: false,
                    unblockedAt: new Date(),
                    updated_at: new Date(),
                    updated_by: req.user ? req.user.mobile : 'unauth'
                }
            });

            if (result) {
                return res.status(200).json({ success: true, message: 'Block entry deactivated' });
            }
            return next(createError.BadRequest('Failed to delete data.'));
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Permanently remove a block record
     */
    permanentDeleteDataById: async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!id) throw createError.BadRequest('Invalid Parameters');

            const result = await Model.deleteOne({ _id: mongoose.Types.ObjectId(id) });

            if (result.deletedCount > 0) {
                return res.status(200).json({ success: true, message: 'Block record deleted permanently' });
            }
            return next(createError.BadRequest('Failed to delete data.'));
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get history of unblocked users
     */
    getDeletedList: async (req, res, next) => {
        try {
            const { page, limit, sort } = req.query;
            const _page = page ? Number(page) : 1;
            const _limit = limit ? Number(limit) : 20;
            const _skip = (_page - 1) * _limit;
            const _sort = sort || 'unblockedAt';

            const query = { isBlocked: false, blocker: mongoose.Types.ObjectId(req.user.id) };

            const list = await Model.aggregate([
                { $match: query },
                { $sort: { [_sort]: -1 } },
                { $skip: _skip },
                { $limit: _limit },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'blocked',
                        foreignField: '_id',
                        as: 'blockedUser'
                    }
                },
                { $unwind: { path: '$blockedUser', preserveNullAndEmptyArrays: true } }
            ]);

            const resultCount = await Model.countDocuments(query);

            return res.status(200).json({
                success: true,
                message: 'Unblocked user history fetched',
                status: 200,
                data: list,
                meta: {
                    current_page: _page,
                    from: _skip + 1,
                    last_page: Math.ceil(resultCount / _limit),
                    per_page: _limit,
                    to: _skip + list.length,
                    total: resultCount,
                },
            });
        } catch (error) {
            return next(error);
        }
    },
};
