/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Ensure environmental variables are loaded
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createCloudinaryStore = (folderName) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `viraag_${folderName}`,
      allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mov', 'pdf'],
      resource_type: 'auto',
    },
  });
};

module.exports = {
  generalStore: createCloudinaryStore('general'),
  videosStore: createCloudinaryStore('videos'),
  imageStore: createCloudinaryStore('images'),
};
