const mongoose = require("mongoose");
const { Schema } = mongoose;

const TableSchema = new Schema({
  category: {
    type: String,
  },
  specialisation: {
    type: String,
  },
  sub_specialisation: {
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

const Scehma = mongoose.model('preference', TableSchema);
module.exports = Scehma;