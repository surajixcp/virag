const mongoose = require('mongoose');

const { Schema } = mongoose;

const TableSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    unique: true,
    required: true,
  },
  is_email: {
    type: Boolean,
    default: true,

  },
  is_mobile: {
    type: Boolean,
    default: true,

  },
  is_approved: {
    type: Boolean,
    default: true,

  },
  is_profile_1: {
    type: Boolean,
    default: false,

  },
  is_profile_2: {
    type: Boolean,
    default: false,

  },
  is_profile_3: {
    type: Boolean,
    default: false,

  },
  is_profile_4: {
    type: Boolean,
    default: false,

  },
  is_profile_5: {
    type: Boolean,
    default: false,

  },
  is_profile_6: {
    type: Boolean,
    default: false,

  },
  is_blocked: {
    type: Boolean,
    default: false,

  },
  kyc_status: {
    type: Boolean,
    default: true,

  },
  bank_account: {
    type: Boolean,
    default: true,
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

const Table = mongoose.model('status', TableSchema);
module.exports = Table;
