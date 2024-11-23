/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const Controller = require('../controllers/skipedProfile.controller');
const { verifyAccessToken } = require('../helpers/authentication/jwt_helper_user')


router.get('/getInfo', Controller.getInfo);

router.post('/profile', verifyAccessToken, Controller.create);

router.put('/undo-profile/:skippedUserId', verifyAccessToken, Controller.unDoSkippedProfile);

router.put('/updateById/:id', verifyAccessToken, Controller.updateById);

router.get('/getList', Controller.getList);

router.get('/getDeletedList', Controller.getDeletedList);

router.get('/getData/ByUserId', verifyAccessToken, Controller.getDataByUserId);

router.get('/getDataById', Controller.getDataById);

router.put('/deleteDataById', Controller.deleteDataById);

router.put('/restoreDataById', Controller.restoreDataById);

router.delete('/permanentDeleteDataById/:id', Controller.permanentDeleteDataById);

module.exports = {
    skipedRouter: router,
};
