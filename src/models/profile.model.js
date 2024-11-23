const mongoose = require('mongoose');

const { Schema } = mongoose;

const TableSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        // unique: true,
        // required: true,
    },
    name: {
        type: String,
        // required: true
    },
    email: {
        type: String,
        // required: true
    },
    mobile: {
        type: Number,
        // required: true
    },
    dob: {
        type: Date,
        // required: true
    },
    gender: {
        type: String,
        // required: true,
        enum: ['Male', 'Female', 'Other']
    },
    location: {
        type: String,
        // required: true
    },
    sexual_orientation: {
        type: String,
        // required: true
    },
    interested_in: [{
        type: String,
        // enum: ['Long term relationship', 'Short term relationship', 'Marriage', 'Friendship', 'Other'],
        // required: true
    }],
    lookingFor: {
        type: String,
    },
    profile_url_1: {
        type: String,
    },
    profile_url_2: {
        type: String,
    },
    profile_url_3: {
        type: String,
    },
    profile_url_4: {
        type: String,
    },
    profile_url_5: {
        type: String,
    },
    comments: [{
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            // ref:"User"
        },
        message: {
            type: String,
        },
        timestamp: {
            type: Date
        },
    }],
    status: {
        type: String,
        enum: ['approved', 'pending', 'rejected'],
        default: 'approved',
    },
    is_verified: {
        type: Boolean,
        default: false,
    },
    is_active: {
        type: Boolean,
        // default: true,
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

const Table = mongoose.model('profile', TableSchema);
module.exports = Table;
