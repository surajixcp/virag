/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const Controller = require('../controllers/kyc.controller');
const {verifyAccessToken} = require('../helpers/authentication/jwt_helper_user.js')

router.get('/getInfo', Controller.getInfo);

router.post('/create',verifyAccessToken, Controller.create);

router.put('/updateById', Controller.updateById);

router.get('/getList', Controller.getList);

router.get('/getDeletedList', Controller.getDeletedList);

router.get('/getDataById', Controller.getDataById);

router.put('/deleteDataById', Controller.deleteDataById);

router.put('/restoreDataById', Controller.restoreDataById);

router.delete('/permanentDeleteDataById/:id', Controller.permanentDeleteDataById);

module.exports = {
  kycRouter: router,
};
