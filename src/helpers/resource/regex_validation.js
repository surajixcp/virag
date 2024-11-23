/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
const _ = require('lodash');

module.exports = {
  dateRegYYYYMMDD: (value) => {
    const regEx = /^\d{4}-\d{1,2}-\d{1,2}$/;
    return value.match(regEx) != null;
  },
  dateRegDDMMYYYY: (value) => {
    const regEx = /^\d{1,2}-\d{1,2}-\d{4}$/;
    return value.match(regEx) != null;
  },
  mobileReg: (value) => {
    const regEx = /^[6-9]\d{9}$/;
    return value.match(regEx) != null;
  },
  isNumber(value) {
    // eslint-disable-next-line no-restricted-globals
    return !isNaN(value) && parseFloat(Number(value)) === value && !isNaN(parseInt(value, 10));
  },
  isKeyInArray: (array, key) => array.some((obj) => Object.prototype.hasOwnProperty.call(obj, key)),
  stringToBoolean: (stringValue) => {
    switch (stringValue.toLowerCase().trim()) {
      case 'true':
      case 'True':
      case 'TRUE':
      case 'yes':
      case '1':
        return true;

      case 'false':
      case 'False':
      case 'FALSE':
      case 'no':
      case '0':
      case null:
      case undefined:
        return false;

      default:
        return JSON.parse(stringValue);
    }
  },
  validateArrayValue: (arr, value) => {
    let valid = false;
    const filteredData = _.filter(arr, _.matches(value));
    if (filteredData.length) {
      valid = true;
    }
    return valid;
  },

  
};
