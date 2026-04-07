/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
/* eslint-disable camelcase */

/* eslint-disable no-underscore-dangle */
const createError = require('http-errors');
const mongoose = require('mongoose');
const Model = require('../models/user.model');
const LifeStyle = require('../models/lifeStyle.model');
const StatusModel = require('../models/status.model');
const { ADMIN_SERVICE_WELCOME_MSG } = require('../helpers/resource/constants');
const { uploadProfileData, uploadProfilePicture } = require('../helpers/resource/helper_functions');
const { currentDateInfo, calculateAge } = require('../helpers/resource/constants')
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { default: axios } = require('axios');
const ModuleName = 'Profile';

const ensureDirectoryExistence = (filePath) => {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    fs.mkdirSync(dirname, { recursive: true });
    return true;
};

const downloadImage = async (url, filepath) => {
    const response = await axios({
        url,
        responseType: 'stream',
    });
    ensureDirectoryExistence(filepath);
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

const compareImages = async (image1Path, image2Path) => {
    try {
        const image1 = await sharp(image1Path).resize(100, 100).toBuffer();
        const image2 = await sharp(image2Path).resize(100, 100).toBuffer();
        return Buffer.compare(image1, image2) === 0;
    } catch (error) {
        console.error('Error comparing images:', error);
        return false;
    }
};

module.exports = {
    /**
   * Fetch the welcome message.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
      */
    getInfo: async (req, res) => res.status(200).json({ message: `${ADMIN_SERVICE_WELCOME_MSG(ModuleName)} Info Route Working` }),

    updatePushToken: async (req, res, next) => {
        try {
            const { pushToken } = req.body;
            let id;
            if (req.user && req.user.id) {
                id = req.user.id;
            }
            if (!id || !pushToken) {
                return res.status(400).json({ success: false, message: 'Missing token or user ID' });
            }
            
            const result = await Model.findByIdAndUpdate(
                { _id: mongoose.Types.ObjectId(id) }, 
                { $set: { expoPushToken: pushToken, updated_at: new Date() } }
            );

            if (result) {
                return res.status(200).json({ success: true, status: 200, message: 'Push Token Updated Successfully' });
            }
            return next(createError.BadRequest('Failed to update push token.'));
        } catch (error) {
            return next(error);
        }
    },

    getProfile: async (req, res, next) => {
        try {
            const id = req.user.id || req.user._id;
            if (!id) {
                return next(createError.Unauthorized('User not authenticated'));
            }
            const result = await Model.aggregate([
                {
                    $match: { _id: mongoose.Types.ObjectId(id) },
                },
                {
                    $lookup: {
                        from: 'lifestyles',
                        localField: '_id',
                        foreignField: 'user_id',
                        as: 'lifestyle'
                    }
                },
                {
                    $addFields: {
                        lifestyle: { $arrayElemAt: ['$lifestyle', 0] }
                    }
                }
            ]);
            if (!result.length) {
                return next(createError.NotFound('Profile not found'));
            }
            return res.status(200).json({
                success: true,
                status: 200,
                message: 'Profile fetched successfully',
                data: result[0]
            });
        } catch (error) {
            return next(error);
        }
    },

    create: async (req, res, next) => {
        try {
            return uploadProfileData(req, res, async (err) => {
                if (err) {
                    return next(createError.BadRequest(err));
                }
                if (req.files) {
                    const fileKeys = [
                        'profile_url_1',
                        'profile_url_2',
                        'profile_url_3',
                        'profile_url_4',
                        'profile_url_5'
                    ];
                    fileKeys.forEach((key) => {
                        if (req.files[key] && req.files[key][0]) {
                            req.body[key] = req.files[key][0].path;
                        }
                    });
                    req.body.incognito = false;
                }
                const data = req.body;
                if ((data.longitude === undefined || data.longitude === null) && (data.latitude === undefined || data.latitude === null)) {
                    return next(createError.BadRequest('Longitude and Latitude are required'));
                }
                let id;
                if (req.user && req.user.id) {
                    id = req.user.id;
                }
                let age = calculateAge(new Date(data.dob));
                if (age) {
                    data.age = age;
                }
                const geoLocation = {
                    type: 'Point',
                    coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)] // Ensure coordinates are numbers
                };
                if (geoLocation) data.geoLocation = geoLocation
                data.created_at = new Date();
                data.updated_at = new Date();
                data.created_by = req.user ? req.user.mobile : 'unauth';
                data.updated_by = req.user ? req.user.mobile : 'unauth';
                data.is_active = true;
                // return
                const doesExist = await Model.findOne({ _id: mongoose.Types.ObjectId(id) }, { id: 1 });
                if (!doesExist) {
                    return next(createError.BadRequest(`Please login ${JSON.stringify(doesExist)}`));
                }
                let result = {};
                let status = {};
                // eslint-disable-next-line max-len
                result = await Model.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(id) }, { $set: data });
                status = await StatusModel.findOne({ user_id: mongoose.Types.ObjectId(id) }, { _id: 1 });
                const pageNumber = data.pageNumber;
                if (pageNumber) {
                    const profileKey = `is_profile_${pageNumber}`;
                    const StatusObj = {
                        [profileKey]: true
                    };

                    const status = await StatusModel.findOne(
                        { user_id: mongoose.Types.ObjectId(id) },
                        { _id: 1 }
                    );

                    if (status) {
                        await StatusModel.updateOne(
                            { user_id: mongoose.Types.ObjectId(id) },
                            { $set: StatusObj }
                        );
                    } else if (pageNumber === 1) {
                        // Only create a new document when on page 1
                        await StatusModel.create({
                            user_id: mongoose.Types.ObjectId(id),
                            [profileKey]: true
                        });
                    }
                }
                if (result) {
                    return res.status(200).json({ success: true, status: 200, message: 'Data Inserted Successfully' });
                }
                return next(createError.BadRequest('Failed to insert data.'));
            });
        } catch (error) {
            return next(error);
        }
    },

    uploadpictures: async (req, res, next) => {
        try {
            return uploadProfileData(req, res, async (err) => {
                if (err) {
                    return next(createError.BadRequest(err));
                }
                // res.json(req.files)
                if (req.files) {
                    const fileKeys = [
                        'profile_url_1',
                        'profile_url_2',
                        'profile_url_3',
                        'profile_url_4',
                        'profile_url_5'
                    ];
                    fileKeys.forEach((key) => {
                        if (req.files[key] && req.files[key][0]) {
                            req.body[key] = req.files[key][0].path;
                        }
                    });
                    req.body.incognito = false;
                }
                const data = req.body;
                let id;
                if (req.user && req.user.id) {
                    id = req.user.id;
                }
                data.updated_at = new Date();
                data.updated_by = req.user ? req.user.mobile : 'unauth';
                data.is_active = true;
                // eslint-disable-next-line max-len
                const doesExist = await Model.findOne({ _id: mongoose.Types.ObjectId(id) });
                if (!doesExist) {
                    return next(createError.BadRequest(`Please login ${JSON.stringify(doesExist)}`));
                }
                if (doesExist) {
                    let result = {};
                    // eslint-disable-next-line max-len
                    result = await Model.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(doesExist._id) }, { $set: data });
                    // TODO: Set notifications for super admin to approve this service
                    if (result) {
                        return res.status(200).json({ success: true, status: 200, message: 'Picture Uploaded Successfully' });
                    }
                }
                else {
                    return next(createError.BadRequest(`Data Not exist ${JSON.stringify(doesExist)}`));
                }
                return next(createError.BadRequest('Failed to insert data.'));
            });
        } catch (error) {
            return next(error);
        }
    },

    verifyProfile: async (req, res, next) => {
        return uploadProfilePicture(req, res, async (err) => {
            if (err) {
                return next(createError.BadRequest(err.message));
            }
            if (!req.file) {
                console.log("Verification upload failed: No image found in request");
                return res.status(400).json({ success: false, message: 'Verification selfie is strictly required.' });
            }
            console.log("Processing verification for user:", req.user && req.user.id ? req.user.id : "null", "File:", req.file && req.file.path ? req.file.path : "null");
            try {
                let id = (req.user && (req.user._id || req.user.id)) ? (req.user._id || req.user.id) : null;
                if (!id) {
                    console.log("Verification Error: User ID missing from request user object");
                    return res.status(401).json({ success: false, message: 'Unauthorized access. Session might have expired.' });
                }
                const doesExist = await Model.findOne({ _id: mongoose.Types.ObjectId(id) });
                if (doesExist) {
                    const updatedData = { 
                        is_verified: true, 
                        verification_image: req.file.path,
                        verification_status: 'verified',
                        updated_at: new Date()
                    };
                    await Model.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updatedData });
                    console.log("Profile Successfully Verified for user:", id);
                    return res.status(200).json({ success: true, message: 'Profile Successfully Verified!' });
                }
                return res.status(404).json({ success: false, message: 'Account not found.' });
            } catch (error) {
                console.error("Verification DB Error:", error);
                return res.status(500).json({ success: false, message: 'Internal server error during verification.' });
            }
        });
    },

    updateFilters: async (req, res, next) => {
        try {
            const userId = req.user.aud;
            const { discoverySettings, interested_in } = req.body;
            
            if (!discoverySettings) {
                return next(createError.BadRequest('Missing discoverySettings parameters'));
            }

            const updatePayload = {
                discoverySettings,
                ...(interested_in && { interested_in })
            };

            await Model.findByIdAndUpdate(mongoose.Types.ObjectId(userId), { $set: updatePayload });
            
            return res.status(200).json({ success: true, message: "Discovery filters successfully mapped to active profile." });
        } catch (error) {
            console.error("Filter Update Error:", error);
            return next(createError.InternalServerError('Error updating discovery parameters'));
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
            // return;
            let result = {};
            // eslint-disable-next-line max-len
            result = await Model.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(Id) }, { $set: data });
            await LifeStyle.findOneAndUpdate(
                { user_id: mongoose.Types.ObjectId(fondedData._id) }, // Query by user_id
                { $set: data }, // Update data
                { new: true, upsert: true } // Return the updated document and create if doesn't exist
            );
            const updatedData = await Model.findOne({ _id: mongoose.Types.ObjectId(Id) });
            const lifestyle = await LifeStyle.findOne({ user_id: mongoose.Types.ObjectId(fondedData._id) });
            // TODO: Set notifications for super admin to approve this service
            if (result) {
                return res.status(200).json({
                    success: true, status: 200, message: 'Data Updated Successfully',
                    profile: updatedData,
                    lifestyle: lifestyle
                });
            }
            return next(createError.BadRequest('Failed to update data.'));
        } catch (error) {
            return next(error);
        }
    },

    MatchesList: async (req, res, next) => {
        try {
            const {
                page, limit, sort, name, location, gender, sexual_orientation, interested_in, lookingFor,
                interests, drinking, smoking, exercise
            } = req.query;

            let user_id = {};
            if (req.user && req.user.id) {
                user_id = req.user.id;
            }
            const _page = page ? Number(page) : 1;
            const _limit = limit ? Number(limit) : 20;
            const _skip = (_page - 1) * _limit;
            const _sort = sort || 'name';
            const query = {};
            
            let currentUser = null;
            let blockedUserIds = [];

            if (user_id) {
                currentUser = await Model.findById(mongoose.Types.ObjectId(user_id));
                const BlockModel = require('../models/Block.model');
                const blockLogs = await BlockModel.find({
                    $or: [
                        { blocker: mongoose.Types.ObjectId(user_id) },
                        { blocked: mongoose.Types.ObjectId(user_id) }
                    ],
                    isBlocked: true
                });
                blockedUserIds = blockLogs.map(b => 
                    b.blocker.toString() === user_id.toString() ? mongoose.Types.ObjectId(b.blocked) : mongoose.Types.ObjectId(b.blocker)
                );
            }
            
            // Append explicit exclusion of self + blocked
            query._id = { $nin: [ mongoose.Types.ObjectId(user_id), ...blockedUserIds ] };
            
            // Age limitations (Removed temporarily to test/view all old dummy users)
            // if (currentUser && currentUser.discoverySettings) {
            //     query.age = {
            //         $gte: currentUser.discoverySettings.minAge || 18,
            //         $lte: currentUser.discoverySettings.maxAge || 60
            //     };
            // }

            if (name) {
                query.name = { $regex: name, $options: "i" };
            }
            if (interested_in) {
                let regexPattern = {}
                if (Array.isArray(interested_in)) {
                    regexPattern = interested_in.join('|');
                } else {
                    regexPattern = interested_in;
                }
                query.interested_in = { $regex: regexPattern, $options: "i" };
            }
            if (location) {
                query.location = { $regex: location, $options: "i" };
            }
            
            query.is_active = true;
            query.otp_verified = true;
            query.is_oldUser = true;
         
            if (gender) {
                query.gender = { $regex: gender, $options: "i" };
            }

            const pipeline = [];

            // Execute $geoNear as the absolute initial state if geo coordinates exist natively
            // (Disabled temporarily to show ALL old users regardless of distance)
            // if (currentUser && currentUser.geoLocation && currentUser.geoLocation.coordinates && currentUser.geoLocation.coordinates.length === 2) {
            //     const searchRadiusMeters = ((currentUser.discoverySettings && currentUser.discoverySettings.maxDistance) || 50) * 1000;
            //     pipeline.push({
            //         $geoNear: {
            //             near: { type: 'Point', coordinates: currentUser.geoLocation.coordinates },
            //             distanceField: "dist.calculated",
            //             maxDistance: searchRadiusMeters,
            //             spherical: true,
            //             query: query
            //         }
            //     });
            // } else {
                pipeline.push({ $match: query });
            // }

            // Remainder of normal nested aggregations
            const remainingStages = [
                {
                    $lookup: {
                        from: 'profilelikes',
                        localField: '_id',
                        foreignField: 'profile_id',
                        as: 'likes'
                    }
                },
                {
                    $lookup: {
                        from: 'lifestyles',
                        localField: '_id',
                        foreignField: 'user_id',
                        as: 'lifestyle'
                    }
                },
                {
                    $addFields: {
                        selfDescription: {
                            $arrayElemAt: ['$lifestyle.selfDescription', 0]
                        }
                    }
                },
                {
                    $project: {
                        lifestyle: 0  // Optionally, remove the 'lifestyle' array if it's no longer needed
                    }
                },
                {
                    $lookup: {
                        from: 'skippedprofiles',
                        localField: '_id',
                        foreignField: 'skippedUserId',
                        as: 'skipped'
                    }
                },

                {
                    $lookup: {
                        from: 'profilelikes',
                        let: { targetId: "$_id" },
                        pipeline: [
                            { $match: { 
                                $expr: { 
                                    $and: [
                                        { $eq: ["$user_id", "$$targetId"] },
                                        { $eq: ["$profile_id", mongoose.Types.ObjectId(user_id)] },
                                        { $eq: ["$is_super_like", true] }
                                    ]
                                }
                            }}
                        ],
                        as: 'receivedSuperLikes'
                    }
                },
                {
                    $addFields: {
                        isSuperLiker: { $gt: [{ $size: "$receivedSuperLikes" }, 0] }
                    }
                },
                {
                    $match: {
                        _id: { $ne: mongoose.Types.ObjectId(user_id) } // Exclude own profile
                    }
                },
                {
                    $project: {
                        _id: 1,
                        mobile: 1,
                        is_verified: 1,
                        is_oldUser: 1,
                        is_active: 1,
                        interested_in: 1,
                        otp_verified: 1,
                        profile_url_1: 1,
                        profile_url_2: 1,
                        name: 1,
                        location: 1,
                        email: 1,
                        gender: 1,
                        age: 1,
                        "likes._id": 1,
                        "likes.user_id": 1,
                        "likes.name": 1,
                        "likes.profile_id": 1,
                        "likes.is_read": 1,
                        "likes.is_liked": 1,
                        "skipped._id": 1,
                        "skipped.user_id": 1,
                        "skipped.name": 1,
                        "skipped.skippedUserId": 1,
                        "skipped.is_read": 1,
                        "skipped.is_skipped": 1,
                        "selfDescription": 1,
                        "isSuperLiker": 1,
                    }
                },
                {
                    $sort: { isSuperLiker: -1, [_sort]: 1 },
                },
                {
                    $skip: _skip,
                },
                {
                    $limit: _limit,
                },
            ];

            const finalPipeline = pipeline.concat(remainingStages);
            list = await Model.aggregate(finalPipeline);
            
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
                // {
                //   $addFields: {
                //     convertedUserId: { $toObjectId: "$user_id" }
                //   }
                // },

                // {
                //     $lookup: {
                //         localField: "user_id",
                //         foreignField: "_id",
                //         from: "users",
                //         as: "user"
                //     },
                // },
                // { $unwind: "$user" },
                // {
                //     $project: {
                //         userId: 0,
                //         __v: 0,
                //         "user._id": 0,
                //         "user.otp": 0,
                //         "user.otp_timestamp": 0,
                //         "user.created_at": 0,
                //         "user.created_by": 0,
                //         "user.updated_at": 0,
                //         "user.updated_by": 0,
                //         "user.__v": 0,
                //     }
                // },
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

    FilterUsers: async (req, res, next) => {
        try {
            const {
                page, limit, sort, name, location, gender, sexual_orientation, interested_in, lookingFor,
                interests, drinking, smoking, exercise, latitude, longitude, radius, minAge, maxAge // Added latitude, longitude, radius
            } = req.query;

            let user_id = {};
            if (req.user && req.user.id) {
                user_id = req.user.id;
            }

            const _page = page ? Number(page) : 1;
            const _limit = limit ? Number(limit) : 20;
            const _skip = (_page - 1) * _limit;
            const _sort = sort || 'name';
            const query = {};
            let list = [];
            // Check and parse latitude and longitude
            const parsedLatitude = latitude ? parseFloat(latitude) : ""
            const parsedLongitude = longitude ? parseFloat(longitude) : ""
            const parsedRadius = radius ? Number(radius) : 10000000;
            if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
                throw createError.BadRequest('Invalid Latitude or Longitude');
            }
            const parsedMinAge = minAge ? Number(minAge) : 18; // Default min age
            const parsedMaxAge = maxAge ? Number(maxAge) : 30; // Default max age

            if (minAge && maxAge) {
                query.age = { $gte: parsedMinAge, $lte: parsedMaxAge };
            }
            if (name) {
                query.name = { $regex: name, $options: "i" };
            }
            if (interested_in) {
                let regexPattern = {};
                if (Array.isArray(interested_in)) {
                    regexPattern = interested_in.join('|');
                } else {
                    regexPattern = interested_in;
                }
                query.interested_in = { $regex: regexPattern, $options: "i" };
            }
            if (location) {
                query.location = { $regex: location, $options: "i" };
            }
            if (gender) {
                query.gender = { $regex: gender, $options: "i" };
            }


            // Perform the geospatial query with other aggregations
            list = await Model.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [parsedLongitude, parsedLatitude], // [longitude, latitude]
                        },
                        distanceField: 'distance',
                        maxDistance: parsedRadius, // Radius in meters
                        spherical: true,
                    },
                },
                {
                    $match: query
                },
                {
                    $lookup: {
                        from: 'profilelikes',
                        localField: '_id',
                        foreignField: 'profile_id',
                        as: 'likes'
                    }
                },
                {
                    $lookup: {
                        from: 'skippedprofiles',
                        localField: '_id',
                        foreignField: 'skippedUserId',
                        as: 'skipped'
                    }
                },
                {
                    $match: {
                        _id: { $ne: mongoose.Types.ObjectId(user_id) } // Exclude own profile
                    }
                },
                {
                    $project: {
                        _id: 1,
                        mobile: 1,
                        geoLocation: 1,
                        is_verified: 1,
                        is_oldUser: 1,
                        is_active: 1,
                        interested_in: 1,
                        otp_verified: 1,
                        profile_url_1: 1,
                        profile_url_2: 1,
                        name: 1,
                        location: 1,
                        email: 1,
                        gender: 1,
                        email: 1,
                        age: 1,
                        distance: 1, // Include distance field
                        "likes._id": 1,
                        "likes.user_id": 1,
                        "likes.name": 1,
                        "likes.profile_id": 1,
                        "likes.is_read": 1,
                        "likes.is_liked": 1,
                        "skipped._id": 1,
                        "skipped.user_id": 1,
                        "skipped.name": 1,
                        "skipped.skippedUserId": 1,
                        "skipped.is_read": 1,
                        "skipped.is_skipped": 1,
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


    // FilterUsers: async (req, res, next) => {
    //     try {
    //         // Extract latitude and longitude from query parameters
    //         const { latitude, longitude } = req.query;

    //         // Validate latitude and longitude
    //         if (!latitude || !longitude) {
    //             throw createError.BadRequest('Latitude and Longitude are required');
    //         }

    //         const parsedLatitude = parseFloat(latitude);
    //         const parsedLongitude = parseFloat(longitude);
    //         const radius = 80000; // Radius in meters
    //         const Minradius = 0

    //         if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
    //             throw createError.BadRequest('Invalid Latitude or Longitude');
    //         }

    //         // Perform the geospatial query
    //         const result = await Model.aggregate([
    //             {
    //                 $geoNear: {
    //                     near: {
    //                         type: 'Point',
    //                         coordinates: [parsedLongitude, parsedLatitude], // [longitude, latitude]
    //                     },
    //                     distanceField: 'distance',
    //                     maxDistance: radius, // Radius in meters
    //                     minDistance: Minradius, // Radius in meters
    //                     spherical: true,
    //                 },
    //             },
    //             {
    //                 $sort: { distance: 1 }, // Optional: Sort by distance
    //             },
    //         ]);
    //         if (!result.length) {
    //             throw createError.NotFound('No users found within the specified radius');
    //         }

    //         // Send successful response
    //         return res.status(200).json({
    //             success: true,
    //             status: 200,
    //             message: 'Details fetched successfully',
    //             data: result,
    //         });
    //     } catch (error) {
    //         // Pass errors to error handling middleware
    //         return next(error);
    //     }
    // },

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
    deleteProfileUrlByKey: async (req, res, next) => {
        try {
            const { id, key } = req.query;

            if (!id || !key || !key.startsWith('profile_url_')) {
                throw createError.BadRequest('Invalid Parameters');
            }

            const data = {
                updated_at: new Date(),
                updated_by: req.user ? req.user.mobile : 'unauth',
            };

            // Prepare $unset to delete the specific key
            const update = {
                $unset: { [key]: "" },
                $set: data
            };

            const result = await Model.findByIdAndUpdate(
                { _id: mongoose.Types.ObjectId(id) },
                update
            );

            if (result) {
                return res.status(200).json({ success: true, message: `${key} deleted successfully` });
            }

            return next(createError.BadRequest('Failed to delete profile URL.'));
        } catch (error) {
            return next(error);
        }
    }
    ,
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
