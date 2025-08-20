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
                            req.body[key] = `/api/download/uploads/${currentDateInfo.year}/${currentDateInfo.month}/${req.files[key][0].filename}`
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
                            req.body[key] = `/api/download/uploads/${currentDateInfo.year}/${currentDateInfo.month}/${req.files[key][0].filename}`
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
                return next(createError.BadRequest('Profile image is required'));
            }
            const currentImagePath = req.file.path;
            let id;
            if (req.user && req.user.id) {
                id = req.user.id;
            }
            try {
                const doesExist = await Model.findOne({ _id: mongoose.Types.ObjectId(id) });
                if (!doesExist) {
                    return next(createError.BadRequest(`Please login ${JSON.stringify(doesExist)}`));
                }
                const previousImagePathUrl = `${process.env.BASEURL + doesExist.profile_url_1}`;
                const previousImagePathLocal = path.join(__dirname, 'downloads', path.basename(previousImagePathUrl));
                let areImagesSame = false;
                if (fs.existsSync(previousImagePathLocal)) {
                    areImagesSame = await compareImages(currentImagePath, previousImagePathLocal);
                } else {
                    await downloadImage(previousImagePathUrl, previousImagePathLocal);
                    areImagesSame = await compareImages(currentImagePath, previousImagePathLocal);
                }
                const data = req.body;
                data.is_verified = areImagesSame ? true : false
                if (areImagesSame) {
                    let result = {};
                    // eslint-disable-next-line max-len
                    result = await Model.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(doesExist._id) }, { $set: data });
                    // TODO: Set notifications for super admin to approve this service
                    if (result) {
                        return res.status(200).json({ Status: areImagesSame, StatusCode: 200, });
                    }
                }
                return res.status(200).json({
                    Status: areImagesSame,
                    Message: "Doesn't Match"
                });

            } catch (error) {
                return next(createError.InternalServerError('Error verifying profile'));
            } finally {
                // Clean up any remaining temporary file if it's not used
                await fs.promises.unlink(currentImagePath).catch(() => { });
            }
        });
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
                { new: true } // Return the updated document
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
            let list = [];
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
            if (gender) {
                query.gender = { $regex: gender, $options: "i" };
            }
            list = await Model.aggregate([
                {
                    $match: query,
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
                        email: 1,
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
