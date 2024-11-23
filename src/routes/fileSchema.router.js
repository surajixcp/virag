/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const Controller = require('../controllers/fileSchema.controller');

router.get('/getInfo', Controller.getInfo);

router.get('/getList', Controller.getList);

module.exports = {
  fileSchemaRouter: router,
};
