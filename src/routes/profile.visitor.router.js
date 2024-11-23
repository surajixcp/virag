/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const Controller = require('../controllers/profile.visitor.controller');
const { verifyAccessToken } = require('../helpers/authentication/jwt_helper_user')


router.get('/getInfo', Controller.getInfo);

router.post('/create', verifyAccessToken, Controller.create);

router.post('/profile-visit', verifyAccessToken, Controller.profileVisit);

router.put('/updateById/:id', verifyAccessToken, Controller.updateById);

router.get('/getList', Controller.getList);

router.get('/getDeletedList', Controller.getDeletedList);

router.get('/getDataById', Controller.getDataById);

router.get('/getVisitors/ByProfileId', verifyAccessToken, Controller.getVisitorsByProfileId);

router.put('/deleteDataById', Controller.deleteDataById);

router.put('/restoreDataById', Controller.restoreDataById);

router.delete('/permanentDeleteDataById/:id', Controller.permanentDeleteDataById);

module.exports = {
    profileVisitorRouter: router,
};
