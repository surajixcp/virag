/* eslint-disable linebreak-style */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const TableSchema = new Schema({

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    // ref: "User",
  },
  aadhar: {
    Number: String,
    file: {
      front: String,
      back: String
    }
  },
  pan: {
    Number: String,
    file: {
      front: String,
    }
  },
  bank: {
    account_no: String,
    account_holder: String,
    ifsc: String,
    bank_name: String
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

const Table = mongoose.model('kyc', TableSchema);
module.exports = Table;
