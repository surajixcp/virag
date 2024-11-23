/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const Controller = require('../controllers/bookmark.controller');

router.get('/getInfo', Controller.getInfo);

router.post('/create', Controller.create);

router.put('/updateById', Controller.updateById);

router.get('/getList', Controller.getList);

router.get('/getDataById', Controller.getDataById);

router.delete('/permanentDeleteDataById/:id', Controller.permanentDeleteDataById);

module.exports = {
  bookmarkRouter: router,
};
