/* eslint-disable linebreak-style */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const TableSchema = new Schema({

  name: {
    type: String,
  },
  details: {
    type: String,
  },
  role_type: {
    type: String,
    unique: true,
    enum: ['Admin', 'User'],
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

const Table = mongoose.model('role', TableSchema);
module.exports = Table;
