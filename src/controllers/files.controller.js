/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
const path = require('path');
const fs = require('fs');
const { upload } = require('../helpers/resource/helper_functions');
const { ADMIN_SERVICE_WELCOME_MSG } = require('../helpers/resource/constants');

const ModuleName = 'File';
module.exports = {
  /**
 * Fetch the welcome message.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
    */

  getInfo: async (req, res) => res.status(200).json({ message: `${ADMIN_SERVICE_WELCOME_MSG(ModuleName)} Info Route Working` }),

  upload: (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        console.log(err)
        return res.status(501).json({ error: err, success:false });
      }
      return res.json({ msg: 'Uploaded Successfully', file: req.file, success: true });
    });
  },

  download: (req, res, next) => {
    try {
      const { location } = req.body;
      let filepath = '';
      let defaultfilepath = '';

      filepath = `${path.join(__dirname, '../../') + location}`;

      defaultfilepath = `${path.join(__dirname, '/../public/uploads')}/no-image.png`;
      if (fs.existsSync(filepath)) {
        return res.status(200).sendFile(filepath);
      }
      return res.status(400).sendFile(defaultfilepath);
    } catch (error) {
      return next(error);
    }
  },

  profileImage: (req, res, next) => {
    try {
      let filepath = '';
      let defaultfilepath = '';

      filepath = `${path.join(__dirname, '../../') + req.params.folder1}/${req.params.folder2}/${req.params.folder3}/$
      {req.params.folder4}/${req.params.filename}`;

      defaultfilepath = `${path.join(__dirname, '/../public/uploads')}/no-image.png`;

      if (fs.existsSync(filepath)) {
        return res.status(200).sendFile(filepath);
      }
      return res.status(400).sendFile(defaultfilepath);
    } catch (error) {
      return next(error);
    }
  },

  postImage: (req, res, next) => {
    try {
      console.log(req.params)
      let filepath = '';
      let defaultfilepath = '';
      filepath = `${path.join(__dirname, '../../') + req.params.folder1}/${req.params.folder2}/${req.params.folder3}/${req.params.filename}`;
      defaultfilepath = `${path.join(__dirname, '/../public/uploads')}/no-image.png`;
      if (fs.existsSync(filepath)) {
        return res.status(200).sendFile(filepath);
      }
      return res.status(400).sendFile(defaultfilepath);
    } catch (error) {
      return next(error);
    }
  },

  
  folderDownload: (req, res) => {
    let filepath = '';
    let defaultfilepath = '';
    filepath = `${path.join(__dirname, '/../uploads')}/${req.params.folder}/${req.params.filename}`;
    defaultfilepath = `${path.join(__dirname, '/../public/uploads')}/no-image.png`;
    if (fs.existsSync(filepath)) {
      return res.status(200).sendFile(filepath);
    }
    return res.status(400).sendFile(defaultfilepath);
  },

};
