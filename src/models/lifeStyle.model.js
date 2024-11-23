const mongoose = require('mongoose');

const { Schema } = mongoose;

const TableSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        // unique: true,
        // required: true,
    },
    profile_id: {
        type: mongoose.Schema.Types.ObjectId,
        // unique: true,
        // required: true,
    },
    interests: [{
        type: String,
        // enum: ['Traveling', 'Music', 'Reading', 'Movies', 'Cooking', 'Other'],
        required: true
    }],
    drinking: {
        type: String,
        // enum: ['Never', 'Socially', 'Often', 'Other']
    },
    smoking: {
        type: String,
        // enum: ['Never', 'Occasionally', 'Regularly', 'Other']
    },
    exercise: {
        type: String,
        // enum: ['Never', 'Sometimes', 'Often']
    },
    loveStyle: {
        type: String,
        // enum: ['Passionate', 'Friendly', 'Other']
    },
    selfDescription: {
        type: String,
        // required: true
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

const Table = mongoose.model('lifestyle', TableSchema);
module.exports = Table;
