/* eslint-disable linebreak-style */
/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
const createError = require('http-errors');
const mongoose = require('mongoose');
const Story = require('../models/story.model');
const Comment = require('../models/comment.model');
const Notification = require('../models/notification.model');
const { uploadMultipleImages } = require("../helpers/resource/helper_functions")
const { currentDateInfo } = require('../helpers/resource/constants')
const ModuleName = 'Story';

module.exports = {
    /**
     * Fetch the welcome message for Story.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    getInfo: async (req, res) => res.status(200).json({ message: `Welcome to the ${ModuleName} Service!` }),

    /**
     * Create a new story.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    createStoryWithImages: (req, res, next) => {
        // Using multer to handle image upload
        uploadMultipleImages(req, res, async (err) => {
            if (err) {
                return next(err); // Handle any errors that occurred during file upload
            }
            try {
                const data = req.body;
                data.created_by = req.user ? req.user.id : "unauth";
                data.created_at = new Date();
                data.updated_at = new Date();
                data.is_active = true;
                if (!req.user) {
                    return res.status(400).json({ message: 'Please Login.' });
                } else {
                    data.user_id = req.user.id
                }
                const IsStoryExist = await Story.findOne({ user_id: mongoose.Types.ObjectId(data.user_id) });
                if (IsStoryExist) {
                    return res.status(400).json({ status: 400, success: true, message: 'You have already posted a story.This will allow soon' });
                } else {

                    // if (req.file) {
                    //     data.mediaUrls = `/api/download/uploads/${currentDateInfo.year}/${currentDateInfo.month}/${file.filename} `
                    // }
                    // Save file paths to the mediaUrls array
                    console.log("req.files", req.files);
                    if (req.files && req.files.length > 0) {
                        data.mediaUrls = req.files.map(file => `/api/download/uploads/${currentDateInfo.year}/${currentDateInfo.month}/${file.filename}`); // Multiple file paths
                    }
                    // Create a new story with the data and images
                    const newStory = new Story(data);
                    const savedStory = await newStory.save();
                    return res.status(200).json({
                        success: true,
                        message: 'Story created successfully',
                        story: savedStory
                    });
                }
            } catch (error) {
                return next(error); // Handle any other errors
            }
        });
    }
    ,
    /**
     * View a story.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    storeUserId: async (fromUserId, toUserId) => {
        try {
            if (!fromUserId || !toUserId) {
                throw createError.BadRequest("User ID not provided.");
            }
            // Find the story by user_id
            let story = await Story.findOne({ user_id: mongoose.Types.ObjectId(toUserId) });
            if (!story) {
                throw createError.BadRequest("Story not found.");
                // story = new Story({
                //     user_id: mongoose.Types.ObjectId(toUserId),
                //     viewers: [],
                // });
                // await story.save();
            }
            const fromUserObjectId = mongoose.Types.ObjectId(fromUserId);
            if (!Array.isArray(story.viewers)) {
                story.viewers = []; // Initialize as an empty array if undefined
            }
            // Check if the viewer already exists
            const viewerExists = story.viewers.some(viewer => viewer.id.equals(fromUserObjectId));
            console.log("viewerExists", viewerExists);
            if (!viewerExists) {
                const newViewer = { id: fromUserObjectId, is_read: true };
                console.log("newViewer", newViewer);
                const updatedStory = await Story.findOneAndUpdate(
                    { user_id: mongoose.Types.ObjectId(toUserId) },
                    { $push: { viewers: newViewer } },
                    { new: true }
                );

                console.log("updatedStory", updatedStory);
                // Notify the story owner
                // const notification = new Notification({
                //     user: story.user,
                //     message: `User ${req.user.username} viewed your story.`,
                // });
                // await notification.save();
            }

            return {
                success: true,
                status: 200,
                message: "Id Added successfully",
                story,
            };
        } catch (error) {
            throw error;
        }
    },
    viewStory: async (req, res, next) => {
        try {
            const { id } = req.query;
            if (!id) {
                throw createError.BadRequest("Invalid Parameters");
            }
            // console.log("req.user", req.user)
            if (!req.user) {
                return res.status(400).json({ message: 'Please Login.' });
            }
            const viewerId = req.user.id; // Assuming the current user's ID
            console.log("id", id)
            console.log("viewerId", viewerId)
            // Update the is_read field to false for the specific viewer
            const updatedStory = await Story.findOneAndUpdate(
                { _id: mongoose.Types.ObjectId(id), "viewers.id": mongoose.Types.ObjectId(viewerId) }, // Match story and viewer
                { $set: { "viewers.$.is_read": false } },  // Set is_read to false
                { new: true } // Return the updated document
            );
            if (!updatedStory) {
                throw createError.NotFound("Story or viewer not found");
            }
            return res.status(200).json({
                success: true,
                status: 200,
                message: "Viewer status updated to false",
                story: updatedStory,
            });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Comment on a story.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    commentOnStory: async (req, res, next) => {
        try {
            const { storyId } = req.params;
            const { text } = req.body;

            const comment = new Comment({
                user: req.user._id,
                story: storyId,
                text,
            });

            const savedComment = await comment.save();

            // Notify story owner
            const story = await Story.findById(storyId);
            const notification = new Notification({
                user: story.user,
                message: `User ${req.user.username} commented on your story.`,
            });
            await notification.save();

            return res.status(200).json({ success: true, status: 200, message: 'Comment posted successfully', comment: savedComment });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get list of stories.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    getList: async (req, res, next) => {
        try {
            const { page, limit, sort } = req.query;
            const _page = page ? Number(page) : 1;
            const _limit = limit ? Number(limit) : 20;
            const _skip = (_page - 1) * _limit;
            const _sort = sort || 'created_at';

            const query = {};
            const stories = await Story.aggregate([
                { $match: query },
                { $sort: { [_sort]: -1 } },
                { $skip: _skip },
                { $limit: _limit }
            ]);
            const totalCount = await Story.countDocuments(query);
            return res.status(200).json({
                success: true,
                status: 200,
                message: 'Stories fetched successfully',
                data: stories,
                meta: {
                    current_page: _page,
                    from: _skip + 1,
                    last_page: Math.ceil(totalCount / _limit),
                    per_page: _limit,
                    to: _skip + stories.length,
                    total: totalCount,
                },
            });
        } catch (error) {
            return next(error);
        }
    },



    GetFriendListStory: async (req, res, next) => {
        try {
            const { id } = req.query;
            let query = {};
            // if (id) {
            //     query = {
            //         "viewers.id": mongoose.Types.ObjectId(id) // Directly match viewers.id with the passed ID
            //     };
            // }
            // if (id) {
            //     query = {
            //         "viewers.id": mongoose.Types.ObjectId(id) // Directly match viewers.id with the passed ID
            //     };
            // }
            const stories = await Story.aggregate([
                {
                    $match: query // Apply the filtering query
                },
                {
                    $lookup: {
                        from: 'users', // Join with the users collection
                        localField: 'user_id', // Field from Story
                        foreignField: '_id', // Field from Users
                        as: 'user' // Alias for the resulting user data
                    }
                },
                {
                    $unwind: {
                        path: "$user",
                        preserveNullAndEmptyArrays: true // optional, if you want to keep docs even if user not found
                    }
                }
                ,
                {
                    $project: { // Project the desired fields
                        "_id": 1,
                        "user_id": 1,
                        "text": 1,
                        "music_url": 1,
                        "mediaUrls": 1,
                        "viewers": 1,
                        "comments": 1,
                        "is_active": 1,
                        "user._id": 1,
                        "user.profile_url_1": 1,
                        "user.name": 1,
                        "user.email": 1,
                        "user.age": 1,
                        "user.gender": 1,
                        "user.location": 1,
                        "user.lookingFor": 1
                    }
                }
            ]);
            if (stories.length <= 0) {
                throw createError.NotFound('No stories found');
            }
            return res.status(200).json({
                success: true,
                status: 200,
                message: 'Stories fetched successfully',
                stories
            });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Delete a story by ID.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    deleteById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const story = await Story.findByIdAndDelete(id);

            if (!story) {
                return next(createError.NotFound('Story not found'));
            }

            return res.status(200).json({ success: true, message: 'Story deleted successfully' });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Restore a deleted story by ID.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    restoreById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const story = await Story.findByIdAndUpdate(id, { is_active: true }, { new: true });

            if (!story) {
                return next(createError.NotFound('Story not found'));
            }

            return res.status(200).json({ success: true, message: 'Story restored successfully', story });
        } catch (error) {
            return next(error);
        }
    },
};
