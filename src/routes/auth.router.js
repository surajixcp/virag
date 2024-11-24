/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const Controller = require('../controllers/auth.controller');

router.get('/getInfo', Controller.getInfo);

router.post('/generateOtp', Controller.generateOtp);

router.post('/login', Controller.userlogin);

router.post('/loginAdmin', Controller.Adminlogin);

router.post('/sendOtptoRegister', Controller.sendOtptoRegister);

router.post('/verifyOtp', Controller.verifyOtp);

module.exports = {
  authRouter: router,
};
