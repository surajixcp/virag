/* eslint-disable linebreak-style */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const TableSchema = new Schema({

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  files: {
    type: String,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    // ref:""
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
  isPortfolio: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: true,
  },
  like: {
    type: String,
  },
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'approved',
  },
  is_active: {
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

const Table = mongoose.model('post', TableSchema);
module.exports = Table;
