const mongoose = require('mongoose');

const { Schema } = mongoose;

const TableSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        // unique: true,
        // required: true,
    },
    name: {
        type: String
        // unique: true,
        // required: true,
    },
    profile_id: {
        type: mongoose.Schema.Types.ObjectId,
        // unique: true,
        // required: true,
    },
    is_read: {
        type: Boolean,
        default: false,

    },
    is_liked: {
        type: Boolean,
        default: true,
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

const Table = mongoose.model('profileLike', TableSchema);
module.exports = Table;
