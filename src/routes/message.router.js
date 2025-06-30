/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const Controller = require('../controllers/message.controller.js');
const { verifyAccessToken } = require('../helpers/authentication/jwt_helper_user.js');
const { blockCheck } = require('../helpers/middleware/middleware.js');


router.get('/getInfo', blockCheck, Controller.getInfo);

router.post('/send', Controller.create);

router.put('/updateById', Controller.updateById);

router.get('/getList', Controller.getList);

router.get('/getDeletedList', Controller.getDeletedList);

router.get("/getUserswithLastMsg", verifyAccessToken, Controller.getConversations);

router.get("/:id", verifyAccessToken, Controller.getMessages);

router.get('/getDataById/:id', Controller.getDataById);

router.put('/deleteDataById', Controller.deleteDataById);

router.put('/restoreDataById', Controller.restoreDataById);

router.delete('/permanentDeleteDataById/:id', Controller.permanentDeleteDataById);

module.exports = {
  MessageRouter: router,
};
