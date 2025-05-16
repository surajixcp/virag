/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const Controller = require('../controllers/story.controller.js');
const { verifyAccessToken } = require('../helpers/authentication/jwt_helper_user.js')

router.get('/getInfo', Controller.getInfo);

router.post('/create', verifyAccessToken, Controller.createStoryWithImages);


router.put('/viewStoryById', verifyAccessToken, Controller.viewStory);

// router.get('/getList', Controller.getList);

router.get('/getFriendListStory',verifyAccessToken, Controller.GetFriendListStory);

// router.get('/getDeletedList', Controller.getDeletedList);

// router.get('/getDataById', Controller.getDataById);

// router.put('/deleteDataById', Controller.deleteDataById);

// router.put('/restoreDataById', Controller.restoreDataById);

// router.delete('/permanentDeleteDataById/:id', Controller.permanentDeleteDataById);

module.exports = {
    storyRouter: router,
};
