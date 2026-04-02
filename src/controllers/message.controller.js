/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
/* eslint-disable camelcase */

/* eslint-disable no-underscore-dangle */
const createError = require('http-errors');
const mongoose = require('mongoose');
const Model = require('../models/message.model');
const Conversation = require('../models/conversation.model');
const { ADMIN_SERVICE_WELCOME_MSG } = require('../helpers/resource/constants');

const ModuleName = 'Conversation';
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
            // eslint-disable-next-line max-len
            // const doesExist = await Model.findOne({ name: data.name }, { name: 1 });
            // if (doesExist) { throw createError.Conflict(`Data already exist ${JSON.stringify(doesExist)}`); }
            const model = new Model(data);
            const savedModel = await model.save();
            // TODO: Set notifications for super admin approve this service
            if (savedModel) {
                return res.status(200).json({ success: true, status: 200, message: 'Message Send Successfully' });
            }
            return next(createError.BadRequest('Failed to insert data.'));
        } catch (error) {
            return next(error);
        }
    },
    messageSeenById: async (req, res, next) => {
        try {
            const conversationid = req.query.data;
            const fondedData = await Model.find({ conversation: mongoose.Types.ObjectId(conversationid) });
            if (fondedData.length <= 0) {
                return next(createError.NotAcceptable('Invalid Query Data'));
            }
            data.updated_at = new Date();
            data.updated_by = req.user ? req.user.mobile : 'unauth';
            data.is_read = true;
            if (!(data.role_type === fondedData.role_type)) {
                return next(createError.NotAcceptable('You cannot change role type!'));
            }
            let result = {};
            // eslint-disable-next-line max-len
            result = await Model.findByIdAndUpdate({ conversation: mongoose.Types.ObjectId(conversationid) }, { $set: data });
            // TODO: Set notifications for super admin to approve this service
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

    // getConversations: async (req, res) => {
    //     const { userId } = req.params;
    //     try {
    //         // Find all messages involving the user
    //         const messages = await Model.find({
    //             $or: [{ fromUserId: userId }, { toUserId: userId }]
    //         })
    //             .sort('-updated_at')
    //             .populate('fromUserId', '-password')
    //             .populate('toUserId', '-password')
    //             .lean();

    //         // Group messages by conversation (user pairs)
    //         const conversationsMap = {};
    //         messages.forEach(message => {
    //             const { fromUserId, toUserId } = message;
    //             const otherUserId = fromUserId._id.toString() === userId ? toUserId._id.toString() : fromUserId._id.toString();

    //             if (!conversationsMap[otherUserId]) {
    //                 conversationsMap[otherUserId] = {
    //                     recipient: fromUserId._id.toString() === userId ? toUserId : fromUserId,
    //                     lastMessageAt: message.updated_at,
    //                     messages: []
    //                 };
    //             }

    //             conversationsMap[otherUserId].messages.push(message);
    //         });

    //         // Convert map to array
    //         const conversations = Object.values(conversationsMap);

    //         return res.json(conversations);
    //     } catch (err) {
    //         console.error(err);
    //         return res.status(500).json({ error: err.message });
    //     }
    // },

    sendMessage: async (req, res) => {
        try {
            const { content, userId, recipientId } = req.body;
            let conversation = await Conversation.findOne({
                recipients: {
                    $all: [userId, recipientId],
                },
            });
            if (!conversation) {
                const conversant = await Conversation.create({
                    recipients: [userId, recipientId],
                });
                return await Model.create({
                    conversation: conversant._id,
                    fromUserId: userId,
                    toUserId: recipientId,
                    content,
                });
            }
            let convers = await Conversation.findOne({
                recipients: {
                    $all: [userId, recipientId],
                },
            });
            await Model.create({
                conversation: convers._id,
                fromUserId: userId,
                toUserId: recipientId,
                content,
            });

            conversation.lastMessageAt = Date.now();
            await conversation.save();

            // SEND PUSH NOTIFICATION FOR NEW MESSAGE
            try {
                const ProfileModel = require('../models/user.model');
                const sender = await ProfileModel.findById(userId);
                const recipient = await ProfileModel.findById(recipientId);

                if (recipient && recipient.expoPushToken && sender) {
                    const { sendPushNotification } = require('../helpers/service/pushService');
                    await sendPushNotification(
                        [recipient.expoPushToken],
                        `New message from ${sender.name || 'someone'} 💬`,
                        content.length > 50 ? content.substring(0, 50) + '...' : content,
                        { route: 'Chat', recipientId: String(sender._id), recipientName: sender.name }
                    );
                }
            } catch (err) {
                console.error("Message Push Error:", err);
            }

            return res.json({ success: true });

            // const recipient = await Model.findById(recipientId);

            // if (!recipient) {
            //     // throw new Error("Recipient not found");
            //     await Conversation.create({

            //         recipients: [userId, recipientId],
            //     });
            // }

            // let conversation = await Conversation.findOne({
            //     recipients: {
            //         $all: [userId, recipientId],
            //     },
            // });

            // if (!conversation) {
            //     conversation = await Conversation.create({
            //         recipients: [userId, recipientId],
            //     });
            // }

            // await Model.create({
            //     conversation: conversation._id,
            //     sender: userId,
            //     content,
            // });

            // conversation.lastMessageAt = Date.now();

            // conversation.save();

            // return res.json({ success: true });
        } catch (err) {
            console.log(err);
            return res.status(400).json({ error: err.message });
        }
    },

    Sendmessage: async (content, userId, recipientId) => {
        try {
            let conversation = await Conversation.findOne({
                recipients: {
                    $all: [userId, recipientId],
                },
            });
            if (!conversation) {
                const conversant = await Conversation.create({
                    recipients: [userId, recipientId],
                });
                return await Model.create({
                    conversation: conversant._id,
                    fromUserId: userId,
                    toUserId: recipientId,
                    content,
                });
            }
            let convers = await Conversation.findOne({
                recipients: {
                    $all: [userId, recipientId],
                },
            });
            await Model.create({
                conversation: convers._id,
                fromUserId: userId,
                toUserId: recipientId,
                content,
            });
            conversation.lastMessageAt = Date.now();
            conversation.save();
            return true;
        } catch (error) {
            return error;
        }
    },
    getMessages: async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!id) {
                throw createError.BadRequest('Invalid Parameters');
            }
            // const conversation = await Conversation.findById(id);
            // if (!conversation) {
            //     throw new Error("Conversation not found");
            // }
            const result = await Model.aggregate([
                {
                    $match: { toUserId: mongoose.Types.ObjectId(id) },
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
                    data: result,
                });
            }
            return next(createError.BadRequest('Failed to update data.'));
        } catch (error) {
            return next(error);
        }

        // try {
        //     const conversationId = req.params.id;
        //     const conversation = await Conversation.findById(conversationId);

        //     if (!conversation) {
        //         throw new Error("Conversation not found");
        //     }

        //     const messages = await Model.find({
        //         conversation: conversation._id,
        //     })
        //     .populate("sender", "-password")
        //     .sort("-createdAt")
        //     .limit(12);
        //     return res.json(messages);
        // } catch (err) {
        //     console.log(err);
        //     return res.status(400).json({ error: err.message });
        // }
    },

    getConversations: async (req, res, next) => {
        try {
            const {
                // eslint-disable-next-line max-len
                name, description, is_active, page, limit, sort,
            } = req.query;
            let userId = {}
            if (req.user && req.user.id) {
                userId = req.user.id;
            }
            const _page = page ? Number(page) : 1;
            const _limit = limit ? Number(limit) : 20;
            const _skip = (_page - 1) * _limit;
            const _sort = sort || 'name';
            const query = {};
            if (userId) {
                query.recipients = {
                    $in: [mongoose.Types.ObjectId(userId)],
                }
            }
            let list = [];
            list = await Conversation.aggregate([
                {
                    $match: query,
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'recipients',
                        foreignField: '_id',
                        as: 'users'
                    }
                },
                {
                    $lookup: {
                        from: 'messages', // Replace with your actual message collection name
                        let: { conversationId: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$conversation', '$$conversationId'] } } },
                            { $sort: { created_at: -1 } },
                            { $limit: 1 },
                        ],
                        as: 'lastMessage',
                    },
                },
                { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
                {
                    $match: name ? {
                        'users.name': { $regex: new RegExp(name.trim(), 'i') }
                    } : {}
                },
                {
                    $project: {
                        _id: 1,
                        lastMessageAt: 1,
                        is_active: 1,
                        recipients: 1,
                        users: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: "$users",
                                        as: "user",
                                        cond: { $ne: ["$$user._id", mongoose.Types.ObjectId(userId)] }
                                    },
                                },
                                as: "user",
                                in: {
                                    _id: "$$user._id",
                                    name: "$$user.name",
                                    profile_url_1: "$$user.profile_url_1",
                                    is_active: "$$user.is_active",
                                    // Add more fields if needed
                                }
                            }
                        },
                        lastMessage: {
                            content: "$lastMessage.content",
                            created_at: "$lastMessage.created_at",
                            fromUserId: "$lastMessage.fromUserId",
                            toUserId: "$lastMessage.toUserId",
                        },

                        // {
                        //     "_id": "676d97669d42c440d58b7b40",
                        //     "conversation": "676d45cfd671f62e4c9bf222",
                        //     "fromUserId": "676bcba86f379376644ad847",
                        //     "toUserId": "676aec066f379376644ad72d",
                        //     "content": "Hi",
                        //     "fileName": "",
                        //     "filePath": "",
                        //     "is_read": false,
                        //     "is_active": false,
                        //     "created_at": "2024-12-26T17:46:46.104Z",
                        //     "created_by": "self",
                        //     "updated_at": "2024-12-26T17:46:46.104Z",
                        //     "updated_by": "self",
                        //     "__v": 0
                        // }


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
            const resultCount = await Conversation.countDocuments(query);
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

        // try {
        //     let userId = {}
        //     if (req.user && req.user.id) {
        //         userId = req.user.id;
        //     }
        //     const conversations = await Conversation.find({
        //         recipients: {
        //             $in: [userId],
        //         },
        //     })
        //         .populate("recipients", "-password")
        //         .sort("-updatedAt")
        //         .lean();

        //     for (let i = 0; i < conversations.length; i++) {
        //         const conversation = conversations[i];
        //         for (let j = 0; j < 2; j++) {
        //             if (conversation.recipients[j]._id != userId) {
        //                 conversation.recipient = conversation.recipients[j];
        //             }
        //         }
        //     }
        //     return res.json(conversations);
        // } catch (err) {
        //     console.log(err);
        //     return res.status(400).json({ error: err.message });
        // }
    },

    getList: async (req, res, next) => {
        try {
            const {
                // eslint-disable-next-line max-len
                name, description, is_active, page, limit, sort,
            } = req.query;
            const _page = page ? Number(page) : 1;
            const _limit = limit ? Number(limit) : 20;
            const _skip = (_page - 1) * _limit;
            const _sort = sort || 'name';
            const query = {};
            if (is_active) {
                query.is_active = !!((is_active && is_active === 'true'));
            }
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

    getMessageBytoUserId: async (req, res, next) => {
        try {
            const { toUserId } = req.params;
            let id = "66a7417baefd46ee9f405fc6";
            if (req.user && req.user.id) {
                id = req.user.id;
            }
            if (!toUserId) {
                throw createError.BadRequest('Invalid Parameters');
            }
            const result = await Model.aggregate([
                {
                    // $match: { toUserId: mongoose.Types.ObjectId(id) },
                    $match: {
                        $or: [
                            { toUserId: mongoose.Types.ObjectId(toUserId) },
                            { fromUserId: mongoose.Types.ObjectId(id) }
                        ]
                    },
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
            const { id } = req.params;
            if (!id) {
                throw createError.BadRequest('Invalid Parameters');
            }
            const result = await Model.aggregate([
                {
                    $match: { toUserId: mongoose.Types.ObjectId(id) },
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
                    data: result,
                });
            }
            return next(createError.BadRequest('Failed to update data.'));
        } catch (error) {
            return next(error);
        }
    },
    deleteDataById: async (req, res, next) => {
        try {
            const { conversation } = req.query;
            if (!conversation) {
                throw createError.BadRequest('Invalid Parameters');
            }
            const data = {};
            data.updated_at = new Date();
            data.updated_by = req.user ? req.user.mobile : 'unauth';
            data.is_active = false;
            let result = {};
            // eslint-disable-next-line max-len
            result = await Model.updateMany({ conversation: mongoose.Types.ObjectId(conversation) }, { $set: data });
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
