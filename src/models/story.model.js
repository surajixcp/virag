/* eslint-disable linebreak-style */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const StorySchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        // ref: "User",
    },
    text: {
        type: String,
    },
    music_url: {
        type: String,
    },
    mediaUrls: [{
        type: String, // Array of URLs for multiple media files (images/videos)
    }],
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        //  ref: 'User'
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        //  ref: 'Comment'
    }],
    
    is_active: {
        type: Boolean,
        default: true,
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
    createdAt: { type: Date, default: Date.now, expires: '24h' }, // Story expires after 24 hours
});

const Story = mongoose.model('story', StorySchema);
module.exports = Story;
