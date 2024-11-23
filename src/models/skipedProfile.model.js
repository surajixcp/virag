/* eslint-disable linebreak-style */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const TableSchema = new Schema({
    name: {
        type: String,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        // ref: 'User'
    },
    skippedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        // ref: 'User'
    },
    is_skipped: {
        type: Boolean,
        default: true,
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

const Table = mongoose.model('skippedProfiles', TableSchema);
module.exports = Table;
