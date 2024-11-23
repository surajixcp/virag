/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const Controller = require('../controllers/files.controller');

router.get('/getInfo', Controller.getInfo);

router.post('/upload', Controller.upload);

router.post('/download', Controller.download);

router.get('/profileImage/:folder1/:folder2/:folder3/:folder4/:filename', Controller.profileImage);

router.get('/postImage/:folder1/:folder2/:folder3/:filename', Controller.postImage);

module.exports = {
  fileRouter: router,
};
