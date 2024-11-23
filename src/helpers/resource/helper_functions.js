/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-plusplus */
const multer = require('multer');
const { generalStore } = require('./stores');

module.exports = {
  upload: multer({ storage: generalStore }).single('file'),
  uploadImage: multer({ storage: generalStore }).single('image'),
  uploadVideos: multer({ storage: generalStore }).single('videos'),
  uploadProfilePicture: multer({ storage: generalStore }).single('profile_picture'),
  uploadMultipleImages: multer({ storage: generalStore }).array('images'),
  uploadMultipleVideos: multer({ storage: generalStore }).array('videos'),
  uploadMultipleImagesAndVideos: multer({ storage: generalStore }).fields([{ name: 'images' }, { name: 'videos' }]),
  uploadVendorData: multer({ storage: generalStore }).fields([
    { name: 'gst_certificate_file_path' },
    { name: 'pan_card_file_path' },
    { name: 'cancel_cheque_file_path' },
    { name: 'MSME_certificates_file_path' },
    { name: 'other_certificates_path' },
    { name: 'signature' },
    { name: 'profile_picture' },
  ]),

  uploadProfileData: multer({ storage: generalStore }).fields([
    { name: 'profile_url_1' },
    { name: 'profile_url_2' },
    { name: 'profile_url_3' },
    { name: 'profile_url_4' },
    { name: 'profile_url_5' },
  ]),
  
  uploadStoryData: multer({ storage: generalStore }).fields([
    { name: 'profile_url_1' },
    { name: 'profile_url_2' },
    { name: 'profile_url_3' },
    { name: 'profile_url_4' },
    { name: 'profile_url_5' },
  ]),

  uploadMultipleDocs: multer({ storage: generalStore }).array('docs'),
  generatePassword: () => {
    const length = 10;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@&%#';
    let retVal = '';
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  },
  percent: (p, total) => +(Number((p / 100) * total)),
  calcGrossGst: (val) => val / 1.18,
  calcTds: (val) => val * (5 / 100),
  getRangeObject: (arr, amt) => {
    const result = arr.filter((o) => amt >= o.from && amt <= o.to);
    return result ? result[0] : null; // or undefined
  },
  test: () => {
    const line = new Error().stack.match(/(:[0-9]+)/)[0].replace(':', '');
    return line;
  },
  generateOtp: (len) => {
    const length = len;
    const charset = '0123456789';
    let retVal = '';
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  },

  generateMobileOtp: async (mobile = 0) => {
    const length = 4;
    const charset = '0123456789';
    let retVal = '1111';
    for (let i = 0, n = charset.length; i < length; ++i) {
      // retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    if (mobile === 8340325876) {
      retVal = '1111';
    }
    return retVal;
  },
  otpTimeStamp: () => {
    const now = new Date();
    // eslint-disable-next-line camelcase
    let otp_timestamp = 0;
    // eslint-disable-next-line camelcase
    otp_timestamp = now.setSeconds(now.getSeconds() + 180);
    // eslint-disable-next-line camelcase
    return otp_timestamp;
  },
  TransactionId: () => `QT-UTR-${Math.floor(Math.random() * 999999999999 + 999999999999)}`,
  ReqId: () => {
    const dateObj = new Date();
    const year = dateObj.getFullYear();
    const Y = year.toString().substr(-1);
    let hour = dateObj.getHours();
    let minutes = dateObj.getMinutes();
    const start = new Date(dateObj.getFullYear(), 0, 0);
    const diff = dateObj - start;
    const oneDay = 1000 * 60 * 60 * 24;
    let day = Math.floor(diff / oneDay);
    if (day.toString().length <= 2) {
      day = `0${day}`;
    }
    if (hour.toString().length <= 1) {
      hour = `0${hour}`;
    }
    if (minutes.toString().length <= 1) {
      minutes = `0${minutes}`;
    }
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    return new Promise((resolve) => {
      let result = '';
      for (let i = 0; i < 27; i++) {
        result += characters.charAt(Math.floor(Math.random() * 27));
      }
      result += Y + day + hour + minutes;
      resolve(result);
    });
  },
  addSearchParams: (url, params = {}) => new URL(
    `${url.origin}${url.pathname}?${new URLSearchParams([
      ...Array.from(url.searchParams.entries()),
      ...Object.entries(params),
    ]).toString()}`,
  ).href,
  constructName: (fName, mName, lName) => {
    if (!mName) {
      // eslint-disable-next-line no-param-reassign
      mName = '';
    }
    let nameArray = [fName, mName, lName];
    nameArray = nameArray.filter(Boolean);
    return nameArray.join(' ').replace(/\b\w/g, (l) => l.toUpperCase());
  },
  timeConvert: (n) => {
    const num = n;
    const hours = (num / 60);
    let rhours = Math.floor(hours);
    let minutes = (hours - rhours) * 60;
    let rminutes = Math.round(minutes);

    const ampm = rhours >= 12 ? 'PM' : 'AM';

    rhours %= 12;
    rhours = rhours || 12;
    minutes = rminutes < 10 ? `0${rminutes}` : rminutes;
    if (rhours.toString().length <= 1) {
      rhours = `0${rhours}`;
    }
    if (rminutes.toString().length <= 1) {
      rminutes = `0${rminutes}`;
    }
    const strTime = `${rhours}:${rminutes} ${ampm}`;

    return strTime;
  },
  substractHours: (date, hours) => new Date(new Date(date).setHours(date.getHours() - hours)),
};
