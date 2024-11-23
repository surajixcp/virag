const mongoose = require("mongoose");
const { Schema } = mongoose;

const TableSchema = new Schema({
    conversation: {
        type: mongoose.Types.ObjectId,
        // ref: "conversation",
        required: true,
    },
    fromUserId: {
        type: mongoose.Types.ObjectId,
        // ref: "user",
        // required: true,
    },
    toUserId: {
        type: mongoose.Types.ObjectId,
        // ref: "user",
        // required: true,
    },
    content: {
        type: String,
        // required: true,
    },
    fileName: {
        type: String,
        // required: false,
    },
    filePath: {
        type: String,
        // required: false,
    },
    is_read: {
        type: Boolean,
        default: false,
    },
    is_active: {
        type: Boolean,
        default: false,
    },
    created_at: {
        type: Date,
        default: new Date(),
    },
    created_by: {
        type: String,
        default: 'self',
    },
    updated_at: {
        type: Date,
        default: new Date(),
    },
    updated_by: {
        type: String,
        default: 'self',
    },

});

const Scehma = mongoose.model('message', TableSchema);
module.exports = Scehma;