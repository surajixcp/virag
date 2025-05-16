/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const Controller = require('../controllers/user.controller');
const { verifyAccessToken } = require('../helpers/authentication/jwt_helper_user.js')

router.get('/getInfo', Controller.getInfo);

router.post('/create', Controller.create);

router.post('/register', Controller.userRegister);

router.put('/updateById', verifyAccessToken, Controller.updateById);

router.put('/updateByIdForAdmin/:id', verifyAccessToken, Controller.updateByIdForAdmin);

router.get('/getList', Controller.getList);

router.get('/getDeletedList', Controller.getDeletedList);

router.get('/getDataById', Controller.getDataById);

router.put('/deleteDataById', Controller.deleteDataById);

router.put('/deleteDataByMobile', Controller.deleteDataByMobile);

router.put('/restoreDataById', Controller.restoreDataById);

router.delete('/permanentDeleteDataById/:id', Controller.permanentDeleteDataById);

module.exports = {
  userRouter: router,
};

