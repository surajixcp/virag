/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const Controller = require('../controllers/profile.controller');
const { verifyAccessToken } = require('../helpers/authentication/jwt_helper_user')


router.get('/getInfo', Controller.getInfo);

router.put('/create', verifyAccessToken, Controller.create);

router.put('/picture-upload', verifyAccessToken, Controller.uploadpictures);

router.put('/verify', verifyAccessToken, Controller.verifyProfile);

router.put('/updateById/:id', verifyAccessToken, Controller.updateById);

router.get('/getList', Controller.getList);

router.get('/getmatches', verifyAccessToken, Controller.MatchesList);

router.get('/getDeletedList', Controller.getDeletedList);

router.get('/getDataById', Controller.getDataById);

router.get('/filter/users', verifyAccessToken, Controller.FilterUsers);

router.put('/deleteProfileUrlByKey', Controller.deleteProfileUrlByKey);

router.put('/deleteDataById', Controller.deleteDataById);

router.put('/restoreDataById', Controller.restoreDataById);

router.delete('/permanentDeleteDataById/:id', Controller.permanentDeleteDataById);

module.exports = {
    profileRouter: router,
};
