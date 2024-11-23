/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
const multer = require('multer');
const fs = require('fs');
const path = require('path');

function generateRandomString(len) {
  const length = len;
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let retVal = '';
  for (let i = 0, n = charset.length; i < length; i += 1) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

module.exports = {
  generalStore: multer.diskStorage({
    destination(req, file, cb) {
      const dateObj = new Date();
      const month = dateObj.getUTCMonth() + 1;
      // const day = dateObj.getUTCDate();
      const year = dateObj.getUTCFullYear();
      if (!fs.existsSync('./uploads')) {
        fs.mkdirSync('./uploads');
      }
      if (!fs.existsSync(`./uploads/${year}`)) {
        fs.mkdirSync(`./uploads/${year}`);
      }
      if (!fs.existsSync(`./uploads/${year}/${month}`)) {
        fs.mkdirSync(`./uploads/${year}/${month}`);
      }
      cb(null, `./uploads/${year}/${month}`);
    },
  
    filename(req, file, cb) {
      cb(null, `${Date.now().toString()}_${path.basename(generateRandomString(12), path.extname(file.originalname))}${path.extname(file.originalname)}`);
      // cb(null, req.body.docname + '.jpg')
    },
  }),
  videosStore: multer.diskStorage({
    destination(req, file, cb) {
      const dateObj = new Date();
      const month = dateObj.getUTCMonth() + 1;
      // const day = dateObj.getUTCDate();
      const year = dateObj.getUTCFullYear();
      if (!fs.existsSync('./src/uploads')) {
        fs.mkdirSync('./src/uploads');
      }
      if (!fs.existsSync(`./src/uploads/${year}`)) {
        fs.mkdirSync(`./src/uploads/${year}`);
      }
      if (!fs.existsSync(`./src/uploads/${year}/${month}`)) {
        fs.mkdirSync(`./src/uploads/${year}/${month}`);
      }
      if (!fs.existsSync(`./src/uploads/${year}/${month}/videos`)) {
        fs.mkdirSync(`./src/uploads/${year}/${month}/videos`);
      }
      cb(null, `./src/uploads/${year}/${month}/videos`);
    },
    filename(req, file, cb) {
      cb(null, `${Date.now().toString()}_${path.basename(generateRandomString(12), path.extname(file.originalname))}${path.extname(file.originalname)}`);
      // cb(null, req.body.docname + '.jpg')
    },
  }),
  imageStore: multer.diskStorage({
    destination(req, file, cb) {
      const dateObj = new Date();
      const month = dateObj.getUTCMonth() + 1;
      // const day = dateObj.getUTCDate();
      const year = dateObj.getUTCFullYear();
      if (!fs.existsSync('./src/uploads')) {
        fs.mkdirSync('./src/uploads');
      }
      if (!fs.existsSync(`./src/uploads/${year}`)) {
        fs.mkdirSync(`./src/uploads/${year}`);
      }
      if (!fs.existsSync(`./src/uploads/${year}/${month}`)) {
        fs.mkdirSync(`./src/uploads/${year}/${month}`);
      }
      if (!fs.existsSync(`./src/uploads/${year}/${month}/images`)) {
        fs.mkdirSync(`./src/uploads/${year}/${month}/images`);
      }
      cb(null, `./src/uploads/${year}/${month}/images`);
    },
    filename(req, file, cb) {
      cb(null, `${Date.now().toString()}_${path.basename(generateRandomString(12), path.extname(file.originalname))}${path.extname(file.originalname)}`);
      // cb(null, req.body.docname + '.jpg')
    },
  }),
};
