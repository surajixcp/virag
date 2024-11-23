const mongoose = require("mongoose");
const { Schema } = mongoose;

const TableSchema = new Schema({
    recipients: [
        {
            type: mongoose.Types.ObjectId,
            ref: "user",
        },
    ],
    lastMessageAt: {
        type: Date,
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

const Scehma = mongoose.model('conversation', TableSchema);
module.exports = Scehma;