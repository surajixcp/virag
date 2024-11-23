/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
/* eslint-disable camelcase */

/* eslint-disable no-underscore-dangle */
const createError = require('http-errors');
const mongoose = require('mongoose');
const Model = require('../models/skipedProfile.model');
const { ADMIN_SERVICE_WELCOME_MSG } = require('../helpers/resource/constants');
const { uploadProfileData } = require('../helpers/resource/helper_functions');
const { currentDateInfo } = require('../helpers/resource/constants')

const ModuleName = 'Skiped Profile';
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
            if (req.user && req.user.id) {
                data.user_id = req.user.id;
            }
            data.created_at = new Date();
            data.updated_at = new Date();
            data.created_by = req.user ? req.user.mobile : 'unauth';
            data.updated_by = req.user ? req.user.mobile : 'unauth';
            data.is_active = true;
            data.is_skipped = true;
            //   // eslint-disable-next-line max-len
            const doesExist = await Model.findOne({ user_id: data.user_id, skippedUserId: data.skippedUserId }, { skippedUserId: 1 });
            if (doesExist) {
                let result = {};
                // eslint-disable-next-line max-len
                result = await Model.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(doesExist._id) }, { $set: data });
                if (result) {
                    return res.status(200).json({ success: true, status: 200, message: 'Data Updated Successfully' });
                }
                return next(createError.BadRequest('Failed to update data.'));

            }
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

    unDoSkippedProfile: async (req, res, next) => {
        try {
            const data = req.body;
            const { skippedUserId } = req.params;
            data.updated_at = new Date();
            data.updated_by = req.user ? req.user.mobile : 'unauth';
            data.is_skipped = false;
            let user_id;
            if (req.user && req.user.id) {
                user_id = req.user.id;
            }
            // eslint-disable-next-line max-len
            const doesExist = await Model.findOne({ user_id: user_id, skippedUserId: skippedUserId }, { skippedUserId: 1 });
            if (!doesExist) {
                throw createError.Conflict(`Data doesn't exist ${JSON.stringify(doesExist)}`);
            }
            let result = {};
            // eslint-disable-next-line max-len
            result = await Model.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(doesExist._id) }, { $set: data });
            if (result) {
                return res.status(200).json({ success: true, status: 200, message: 'Data Updated Successfully' });
            }
            return next(createError.BadRequest('Failed to update data.'));
        } catch (error) {
            return next(error);
        }
    },
    updateById: async (req, res, next) => {
        try {
            const Id = req.params;
            const data = req.body;
            const fondedData = await Model.findOne({ _id: mongoose.Types.ObjectId(Id) });
            if (!data) {
                return next(createError.NotAcceptable('Invalid Query Data'));
            }
            data.updated_at = new Date();
            data.updated_by = req.user ? req.user.mobile : 'unauth';
            data.is_active = false;
            let result = {};
            // eslint-disable-next-line max-len
            result = await Model.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(Id) }, { $set: data });
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
                    $lookup: {
                        localField: "user_id",
                        foreignField: "_id",
                        from: "users",
                        as: "user"
                    },
                },
                {
                    $project: {
                        userId: 0,
                        __v: 0,
                        "user._id": 0,
                        "user.otp": 0,
                        "user.otp_timestamp": 0,
                        "user.created_at": 0,
                        "user.created_by": 0,
                        "user.updated_at": 0,
                        "user.updated_by": 0,
                        "user.__v": 0,
                    }
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
    getDataByUserId: async (req, res, next) => {
        try {
            const {
                page, limit, sort, name, location, gender, is_skipped = true
            } = req.query;
            const _page = page ? Number(page) : 1;
            const _limit = limit ? Number(limit) : 20;
            const _skip = (_page - 1) * _limit;
            const _sort = sort || 'name';
            let query = {};
            let list = [];
            let user_id = {};
            if (req.user && req.user.id) {
                user_id = req.user.id;
                // query.user_id = req.user.id;
            } else {
                return next(createError.Unauthorized('User not authenticated'));
            }
            query = { user_id: mongoose.Types.ObjectId(user_id) };
            if (name) {
                query.name = { $regex: name, $options: "i" };
            }
            if (location) {
                query.location = { $regex: location, $options: "i" };
            }
            if (gender) {
                query.gender = { $regex: gender, $options: "i" };
            }
            if (is_skipped) {
                query.is_skipped = !!((is_skipped && is_skipped === true));
            }
            list = await Model.aggregate([
                {
                    $match: query,
                },
                {
                    $lookup: {
                        from: 'profilelikes',
                        localField: 'skippedUserId',
                        foreignField: 'profile_id',
                        as: 'liked'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'skippedUserId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $addFields: {
                        is_liked: {
                            $cond: {
                                if: {
                                    $gt: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: "$liked",
                                                    as: "like",
                                                    cond: {
                                                        $and: [
                                                            { $eq: ["$$like.user_id", mongoose.Types.ObjectId(user_id)] },
                                                            { $eq: ["$$like.is_liked", true] }
                                                        ]
                                                    }
                                                }
                                            }
                                        },
                                        0
                                    ]
                                },
                                then: true,
                                else: false
                            }
                        },
                        // is_skipped: {
                        //     $cond: {
                        //         if: {
                        //             $gt: [
                        //                 {
                        //                     $size: {
                        //                         $filter: {
                        //                             input: "$skipped",
                        //                             as: "skip",
                        //                             cond: {
                        //                                 $and: [
                        //                                     { $eq: ["$$skip.user_id", mongoose.Types.ObjectId(user_id)] },
                        //                                     { $eq: ["$$skip.is_skipped", true] },

                        //                                 ]
                        //                             }
                        //                         }
                        //                     }
                        //                 },
                        //                 0
                        //             ]
                        //         },
                        //         then: true,
                        //         else: false
                        //     }

                        // }
                    }
                },
                {
                    $project: {
                        created_by: 0,
                        created_at: 0,
                        updated_at: 0,
                        updated_by: 0,
                        __v: 0,
                        "user._id": 0,
                        "user.mobile": 0,
                        "user.likeCount": 0,
                        "user.status": 0,
                        "user.interested_in": 0,
                        "user.otp_verified": 0,
                        "user.lookingFor": 0,
                        "user.sexual_orientation": 0,
                        "user.role": 0,
                        "user.email": 0,
                        "user.otp": 0,
                        "user.otp_timestamp": 0,
                        "user.created_at": 0,
                        "user.created_by": 0,
                        "user.updated_at": 0,
                        "user.updated_by": 0,
                        "user.__v": 0,
                        "liked._id": 0,
                        "liked.__v": 0,
                        "liked.newField": 0,
                        "liked.created_at": 0,
                        "liked.created_by": 0,
                        "liked.updated_at": 0,
                        "liked.updated_by": 0,
                    }
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
