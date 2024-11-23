/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const util = require('util');

const { CastError } = mongoose.SchemaType;

function FloatType(digits) {
  function Float(path, options) {
    this.path = path;
    mongoose.SchemaTypes.Number.call(this, path, options);
  }

  util.inherits(Float, mongoose.SchemaTypes.Number);

  Float.prototype.cast = (value) => {
    if (value == null || value === '') {
      return value;
    }

    if (typeof value === 'string' || typeof value === 'boolean') {
      value = Number(value);
    }

    // eslint-disable-next-line no-restricted-globals
    if (isNaN(value)) return new CastError('Number', value, this.path);

    return Number(value.toFixed(digits || 2));
  };

  Float._checkRequired = (value) => typeof value === 'number' || value instanceof Number;

  return Float;
}

module.exports.loadType = (mongoose, digits) => {
  const floatType = new FloatType(digits);

  if (mongoose.Schema && typeof mongoose.Schema.Types === 'object') {
    mongoose.Schema.Types.Float = floatType;
  }

  if (typeof mongoose.SchemaTypes === 'object') {
    mongoose.SchemaTypes.Float = floatType;
  }

  if (typeof mongoose.Types === 'object') {
    mongoose.Types.Float = floatType;
  }

  return floatType;
};
