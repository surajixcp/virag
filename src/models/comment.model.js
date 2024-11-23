const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        // ref: 'User'
    },
    story_id: {
        type: mongoose.Schema.Types.ObjectId,
        // ref: 'Story'
    },
    text: {
        type: String,
    }
    ,
    createdAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
