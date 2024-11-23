/* eslint-disable linebreak-style */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const TableSchema = new Schema({

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    // ref:"User"
  },
  reviewer_id: {
    type: mongoose.Schema.Types.ObjectId,
    // ref:"User"
  },
  rating: {
    type: String,
  },
  description: {
    type: String,
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

const Table = mongoose.model('review', TableSchema);
module.exports = Table;
