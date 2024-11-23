/* eslint-disable linebreak-style */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const FileSchema = new Schema({
  filename: {
    type: String,
    required: true,
  },
  originalname: {
    type: String,
  },
  location: {
    type: String,
  },
  mimetype: {
    type: String,
  },
  filetype: {
    type: String,
  },
  path: {
    type: String,
  },
  destination: {
    type: String,
  },
  size: {
    type: String,
  },
  purpose: {
    type: String,
    default: '',
  },
  owner: {
    type: Array,
    default: [],
  },
  is_processed: {
    type: Boolean,
    default: false,
  },
  is_approved: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
  created_by: {
    type: String,
    default: 'superadmin',
  },
  updated_at: {
    type: Date,
    default: Date.now(),
  },
  updated_by: {
    type: String,
    default: 'superadmin',
  },
});

const File = mongoose.model('file', FileSchema);
module.exports = File;
