/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
/* eslint-disable camelcase */

/* eslint-disable no-underscore-dangle */
const createError = require('http-errors');
const mongoose = require('mongoose');
const Model = require('../models/profileLike.model');
const ProfileModel = require('../models/user.model');
const { ADMIN_SERVICE_WELCOME_MSG } = require('../helpers/resource/constants');

const ModuleName = 'Profile Like';
module.exports = {
    /**
   * Fetch the welcome message.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
      */

    getInfo: async (req, res) => res.status(200).json({ message: `${ADMIN_SERVICE_WELCOME_MSG(ModuleName)} Info Route Working` }),

    create: async (req, res, next) => {
        try {
            const data = req.body;
            data.created_at = new Date();
            data.updated_at = new Date();
            data.created_by = req.user ? req.user.mobile : 'unauth';
            data.updated_by = req.user ? req.user.mobile : 'unauth';
            data.is_active = true;
            let id;
            if (req.user && req.user.id) {
                id = req.user.id;
            }
            // eslint-disable-next-line max-len
            const doesExist = await Model.findOne({ name: data.name }, { name: 1 });
            if (doesExist) { throw createError.Conflict(`Data already exist ${JSON.stringify(doesExist)}`); }
            const model = new Model(data);
            const savedModel = await model.save();
            // TODO: Set notifications for super admin approve this service
            if (savedModel) {
                return res.status(200).json({ success: true, status: 200, message: 'Data Inserted Successfully' });
            }
            return next(createError.BadRequest('Failed to insert data.'));
        } catch (error) {
            return next(error);
        }
    },

    profileLike: async (req, res, next) => {
        try {
            const data = req.body;
            data.created_at = new Date();
            data.updated_at = new Date();
            data.created_by = req.user ? req.user.mobile : 'unauth';
            data.updated_by = req.user ? req.user.mobile : 'unauth';
            data.is_active = true;
            data.is_liked = true;
            if (req.user && req.user.id) {
                data.user_id = req.user.id;
            }
            // eslint-disable-next-line max-len
            const isExist = await Model.findOne({ profile_id: mongoose.Types.ObjectId(data.profile_id) });
            const doesExist = await Model.findOne({ user_id: data.user_id, profile_id: data.profile_id }, { profile_id: 1 });
            if (doesExist) {
                let result = {};
                // eslint-disable-next-line max-len
                result = await Model.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(doesExist._id) }, { $set: data });
                if (result) {
                    return res.status(200).json({ success: true, status: 200, message: 'Data Updated Successfully' });
                }
                return next(createError.BadRequest('Failed to update data.'));
            }
            await Model.create(data);
            isExist.likeCount = (await Model.find({ profile_id: mongoose.Types.ObjectId(data.profile_id) })).length;
            // await isExist.save();
            if (isExist) {
                return res.status(200).json({
                    success: true,
                    message: "Successfully.",
                    status: 200
                });
            }
            return next(createError.BadRequest('Failed to insert data.'));
        } catch (error) {
            return next(error);
        }
    },
    profileDisLike: async (req, res, next) => {
        try {
            const data = req.body;
            const { profile_id } = req.params;
            data.updated_at = new Date();
            data.updated_by = req.user ? req.user.mobile : 'unauth';
            data.is_liked = false;
            let user_id = {};
            if (req.user && req.user.id) {
                user_id = req.user.id;
            }
            // eslint-disable-next-line max-len
            const isExist = await Model.findOne({ profile_id });
            const existingProfileLike = await Model.findOne({ user_id: user_id, profile_id: profile_id }, { profile_id: 1 });
            if (!existingProfileLike) {
                throw createError.Conflict("Doesn't Exist.");
            }
            let result = {};
            // eslint-disable-next-line max-len
            result = await Model.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(existingProfileLike._id) }, { $set: data });
            if (result) {
                return res.status(200).json({ success: true, status: 200, message: 'Successfully Disliked.' });
            }
            isExist.likeCount = (await Model.find({ profile_id })).length;
            // await isExist.save();
            // if (isExist) {
            //     return res.status(200).json({
            //         success: true,
            //         message: "Successfully Disliked.",
            //         status: 200
            //     });
            // }
            return next(createError.BadRequest('Failed.'));
        } catch (error) {
            return next(error);
        }
    },

    updateById: async (req, res, next) => {
        try {
            const data = req.body;
            const fondedData = await Model.findOne({ _id: mongoose.Types.ObjectId(data._id) });
            if (!data) {
                return next(createError.NotAcceptable('Invalid Query Data'));
            }
            data.updated_at = new Date();
            data.updated_by = req.user ? req.user.mobile : 'unauth';
            data.is_active = false;
            if (!(data.role_type === fondedData.role_type)) {
                return next(createError.NotAcceptable('You cannot change role type!'));
            }
            let result = {};
            // eslint-disable-next-line max-len
            result = await Model.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(data._id) }, { $set: data });
            // TODO: Set notifications for super admin to approve this service
            if (result) {
                return res.status(200).json({ success: true, status: 200, message: 'Data Updated Successfully' });
            }
            return next(createError.BadRequest('Failed to update data.'));
        } catch (error) {
            return next(error);
        }
    },

    getList: async (req, res, next) => {
        try {
            const {
                // eslint-disable-next-line max-len
                page, limit, sort,
            } = req.query;
            console.log("res", res)
            const _page = page ? Number(page) : 1;
            const _limit = limit ? Number(limit) : 20;
            const _skip = (_page - 1) * _limit;
            const _sort = sort || 'name';
            const query = {};
            let list = [];
            list = await Model.aggregate([
                {
                    $match: query,
                },
                {
                    $sort: { [_sort]: 1 },
                },
                {
                    $skip: _skip,
                },
                {
                    $limit: _limit,
                },
            ]);

            const resultCount = await Model.countDocuments(query);
            if (list) {
                return res.status(200).json({
                    success: true,
                    message: 'Data Fetched',
                    status: 200,
                    data: list,
                    meta: {
                        current_page: _page,
                        from: _skip + 1,
                        last_page: Math.ceil(resultCount / _limit, 10),
                        per_page: _limit,
                        to: _skip + _limit,
                        total: resultCount,
                    },
                });
            }
            return next(createError.BadRequest('Failed to get data.'));
        } catch (error) {
            return next(error);
        }
    },

    getlikesByProfileId: async (req, res, next) => {
        try {
            let id = {};
            if (req.user && req.user.id) {
                id = req.user.id;
            }
            if (!id) {
                throw createError.BadRequest('Invalid Parameters');
            }
            const query = {
                profile_id: mongoose.Types.ObjectId(id),
                is_liked: true,
            };
            const result = await Model.aggregate([
                {
                    $match: query,
                },
                {
                    $lookup: {
                        localField: "user_id",
                        foreignField: "_id",
                        from: "users",
                        as: "profile"
                    },
                }
            ]);
            if (!result.length) {
                throw createError.NotFound(`No ${ModuleName} Found`);
            }
            if (result) {
                return res.status(200).json({
                    success: true,
                    status: 200,
                    message: 'Detail Fetched',
                    data: result,
                });
            }
            return next(createError.BadRequest('Failed to update data.'));
        } catch (error) {
            return next(error);
        }
    },

    getDataById: async (req, res, next) => {
        try {
            const { id } = req.query;
            if (!id) {
                throw createError.BadRequest('Invalid Parameters');
            }
            const result = await Model.aggregate([
                {
                    $match: { _id: mongoose.Types.ObjectId(id) },
                },
            ]);
            if (!result.length) {
                throw createError.NotFound(`No ${ModuleName} Found`);
            }
            if (result) {
                return res.status(200).json({
                    success: true,
                    status: 200,
                    message: 'Detail Fetched',
                    data: result[0],
                });
            }
            return next(createError.BadRequest('Failed to update data.'));
        } catch (error) {
            return next(error);
        }
    },
    deleteDataById: async (req, res, next) => {
        try {
            const { id } = req.query;
            if (!id) {
                throw createError.BadRequest('Invalid Parameters');
            }
            const data = {};
            data.updated_at = new Date();
            data.updated_by = req.user ? req.user.mobile : 'unauth';
            data.is_active = false;
            let result = {};
            // eslint-disable-next-line max-len
            result = await Model.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(id) }, { $set: data });
            if (result) {
                return res.status(200).json({ success: true, message: 'Data Deleted Successfully' });
            }
            return next(createError.BadRequest('Failed to delete data.'));
        } catch (error) {
            return next(error);
        }
    },
    restoreDataById: async (req, res, next) => {
        try {
            const { id } = req.query;
            if (!id) {
                throw createError.BadRequest('Invalid Parameters');
            }
            const data = {};
            data.updated_at = new Date();
            data.updated_by = req.user ? req.user.mobile : 'unauth';
            data.is_active = true;
            let result = {};
            // eslint-disable-next-line max-len
            result = await Model.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(id) }, { $set: data });
            if (result) {
                return res.status(200).json({ success: true, message: 'Data restored successfully' });
            }
            return next(createError.BadRequest('Failed to restore data.'));
        } catch (error) {
            return next(error);
        }
    },
    permanentDeleteDataById: async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!id) {
                throw createError.BadRequest('Invalid Parameters');
            }

            let result = {};
            result = await Model.deleteOne({ _id: mongoose.Types.ObjectId(id) });
            if (result) {
                return res.status(200).json({ success: true, message: 'Data Deleted Successfully' });
            }
            return next(createError.BadRequest('Failed to delete data.'));
        } catch (error) {
            return next(error);
        }
    },
    getDeletedList: async (req, res, next) => {
        try {
            const {
                // eslint-disable-next-line max-len
                name, role_type, page, limit, sort,
            } = req.query;
            const _page = page ? Number(page) : 1;
            const _limit = limit ? Number(limit) : 20;
            const _skip = (_page - 1) * _limit;
            const _sort = sort || 'role_type';
            const query = {};
            if (name) {
                query.name = new RegExp(name, 'i');
            }
            if (role_type) {
                query.role_type = new RegExp(role_type, 'i');
            }
            query.is_active = true;
            let list = [];
            list = await Model.aggregate([
                {
                    $match: query,
                },
                {
                    $sort: { [_sort]: 1 },
                },
                {
                    $skip: _skip,
                },
                {
                    $limit: _limit,
                },
            ]);
            const resultCount = await Model.countDocuments(query);
            if (list) {
                return res.status(200).json({
                    success: true,
                    message: 'Data Fetched',
                    data: list,
                    status: 200,
                    meta: {
                        current_page: _page,
                        from: _skip + 1,
                        last_page: Math.ceil(resultCount / _limit, 10),
                        per_page: _limit,
                        to: _skip + _limit,
                        total: resultCount,
                    },
                });
            }
            return next(createError.BadRequest('Failed to fetch data.'));
        } catch (error) {
            return next(error);
        }
    },
};
