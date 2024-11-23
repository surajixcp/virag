/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
// map all error names to corresponding HTTP codes
const ERROR_MAPPING = {
  400: ['CastError', 'ValidationError'],
};

const MORGAN_CONFIG = ':method :url :status :res[content-length] :remote-addr - :response-time ms';
const ADMIN_SERVICE_WELCOME_MSG = (serviceName) => `Welcome to the Viraag ${serviceName} management!`;


const dateObj = new Date();
const currentDateInfo = {
  dateObj: dateObj,
  month: dateObj.getUTCMonth() + 1,
  day: dateObj.getUTCDate(),
  year: dateObj.getUTCFullYear()
};

const calculateAge = (dob) => {
  const diffMs = Date.now() - dob.getTime();
  const ageDt = new Date(diffMs);

  return Math.abs(ageDt.getUTCFullYear() - 1970);
};

module.exports = {
  calculateAge,
  MORGAN_CONFIG,
  ADMIN_SERVICE_WELCOME_MSG,
  ERROR_MAPPING,
  currentDateInfo
};
