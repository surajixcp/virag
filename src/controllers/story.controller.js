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
                // Save file paths to the mediaUrls array
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
    viewStory: async (req, res, next) => {
        try {
            const { storyId } = req.params;
            const story = await Story.findById(storyId);

            if (!story) {
                throw createError.NotFound('Story not found');
            }

            // Add viewer if not already viewed
            if (!story.viewers.includes(req.user._id)) {
                story.viewers.push(req.user._id);
                await story.save();

                // Notify story owner
                const notification = new Notification({
                    user: story.user,
                    message: `User ${req.user.username} viewed your story.`,
                });
                await notification.save();
            }

            return res.status(200).json({ success: true, status: 200, message: 'Story viewed successfully', story });
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
