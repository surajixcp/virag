/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const Controller = require('../controllers/profileLike.controller');
const { verifyAccessToken } = require('../helpers/authentication/jwt_helper_user')


router.get('/getInfo', Controller.getInfo);

router.post('/create', verifyAccessToken, Controller.create);

router.post('/profile-like', verifyAccessToken, Controller.profileLike);

router.post('/profile-dislike/:profile_id', verifyAccessToken, Controller.profileDisLike);

router.put('/updateById/:id', verifyAccessToken, Controller.updateById);

router.get('/getList', Controller.getList);

router.get('/getDeletedList', Controller.getDeletedList);

router.get('/getDataById', Controller.getDataById);

router.get('/getlikesByprofileId', verifyAccessToken, Controller.getlikesByProfileId);

router.get('/who-liked-me', verifyAccessToken, Controller.whoLikedMe);

router.put('/deleteDataById', Controller.deleteDataById);

router.put('/restoreDataById', Controller.restoreDataById);

router.delete('/permanentDeleteDataById/:id', Controller.permanentDeleteDataById);

module.exports = {
    profileLikeRouter: router,
};
