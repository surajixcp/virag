const mongoose = require("mongoose");
const { Schema } = mongoose;

const TableSchema = new Schema({
    // The user who is blocking someone
    blocker: {
        type: mongoose.Schema.Types.ObjectId, // References a User ID
        ref: 'User',                          // Link to the User collection
        required: true                        // Cannot be empty
    },
    // The user who is being blocked
    blocked: {
        type: mongoose.Schema.Types.ObjectId, // References a User ID
        ref: 'User',                          // Link to the User collection
        required: true                        // Cannot be empty
    },
    // Status to determine if the user is currently blocked or unblocked
    isBlocked: {
        type: Boolean,
        default: true                        // By default, it is a block action
    },

    // Optional: reason why the user was blocked
    reason: {
        type: String
    },

    // Timestamp when user was blocked
    blockedAt: {
        type: Date,
        default: Date.now                   // Automatically set to current date/time on creation
    },

    // Timestamp when user was unblocked (set when unblocking)
    unblockedAt: {
        type: Date                          // Will remain empty until unblocked
    }
    ,                   // Adds createdAt and updatedAt fields automatical
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

const Scehma = mongoose.model('block', TableSchema);
module.exports = Scehma;