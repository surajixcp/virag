/* eslint-disable linebreak-style */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const TableSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  name: {
    type: String,
  },
  plan_type: {
    type: String,
    enum: ['basic', 'standered',
      'premium']
  },
  price: {
    type: Object
  },
  serviceTat: {
    type: String,
    enum: ['hr', 'day',
      'week', 'month',
      'quaterly', 'yearly']
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

const Table = mongoose.model('package', TableSchema);
module.exports = Table;
