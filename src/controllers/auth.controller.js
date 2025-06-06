/* eslint-disable linebreak-style */
/* eslint-disable no-unused-vars */
/* eslint import/no-unresolved: [2, { amd: true }] */
/* eslint-disable camelcase */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */

const createError = require('http-errors');
const mongoose = require('mongoose');
const moment = require('moment');
const momentDurationFormatSetup = require('moment-duration-format');
const Model = require('../models/user.model');
const StatusModel = require('../models/status.model');
const RoleModel = require('../models/role.model');
const { ADMIN_SERVICE_WELCOME_MSG } = require('../helpers/resource/constants');
const config = require('../helpers/environment/config');
const {
  signAccessToken,

} = require('../helpers/authentication/jwt_helper_user');
const {
  generateMobileOtp,
  otpTimeStamp,
  generatePassword,
  generateOtp,
} = require('../helpers/resource/helper_functions');
const { mailHelper } = require('../helpers/resource/helper_functions');
const { sendOtp } = require('../helpers/utils/sendMessage');
const { logger } = require('../helpers/service/loggerService');
const ModuleName = 'Auth';


module.exports = {
  /**
   * Fetch the welcome message.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  getInfo: async (req, res) => res
    .status(200)
    .json({
      message: `${ADMIN_SERVICE_WELCOME_MSG(ModuleName)} Info Route Working`,
    }),

  Adminlogin: async (req, res, next) => {
    try {
      const result = req.body;
      if (result.role_type !== "Super Admin") {
        return next(createError.BadRequest("Invalid Role Type!"));
      }
      // eslint-disable-next-line max-len
      const user = await Model.findOne({ email: result.email });
      if (!user) {
        return next(createError.BadRequest("Not found!"));
      }
      let savedRole = await RoleModel.findOne(
        { role_type: result.role_type },
        { _id: 1 }
      );
      if (!savedRole) {
        return next(createError.BadRequest("Invalid Role Type!"));
      }
      const isMatch = await user.isValidPassword(result.password);
      if (!isMatch) {
        return next(createError.NotAcceptable("password not valid"));
      }
      const accessToken = await signAccessToken(user.id);
      return res.send({
        token: accessToken,
        user,
        success: true,
        message: "PASSWORD VERIFIED SUCCESSFULLY",
      });
    } catch (error) {
      return next(error);
    }
  },
  userlogin: async (req, res, next) => {
    try {
      const result = req.body;
      if (result.role_type !== "User") {
        return next(createError.BadRequest("Invalid Role Type!"));
      }
      // eslint-disable-next-line max-len
      const user = await Model.findOne({ email: result.email });
      if (!user) {
        return next(createError.BadRequest("Not found!"));
      }
      let savedRole = await RoleModel.findOne(
        { role_type: result.role_type },
        { _id: 1 }
      );
      if (!savedRole) {
        return next(createError.BadRequest("Invalid Role Type!"));
      }
      const isMatch = await user.isValidPassword(result.password);
      if (!isMatch) {
        return next(createError.NotAcceptable("password not valid"));
      }
      const accessToken = await signAccessToken(user.id);
      return res.send({
        token: accessToken,
        user,
        success: true,
        message: "PASSWORD VERIFIED SUCCESSFULLY",
      });
    } catch (error) {
      return next(error);
    }
  },
  generateOtp: async (req, res, next) => {
    try {
      const result = req.body;
      if (result.role_type !== 'User') {
        return next(createError.BadRequest('Invalid Role Type!'));
      }
      // eslint-disable-next-line max-len
      const user = await Model.findOne({ mobile: result.mobile });
      const dtm = {
        otp: await generateMobileOtp(4),
        otp_timestamp: otpTimeStamp(),
        otp_verified: false,
      };
      if (!user) {
        dtm.mobile = result.mobile;
        let savedRole = await RoleModel.findOne({ role_type: result.role_type }, { _id: 1 });
        if (savedRole) {
          result.role = savedRole._id;
          dtm.role = savedRole._id;
        } else {
          savedRole = await RoleModel.create(
            { name: result.role_type, role_type: result.role_type },
          );
          result.role = savedRole._id;
          dtm.role = savedRole._id;
        }
        const newUser = new Model(dtm);
        const savedUser = await newUser.save();
        // role
        // await StatusModel.create({ user_id: newUser._id });

        // status
        if (savedUser) {
          return res.status(200).json({
            success: true,
            status: 200,
            message: 'Otp send successfully.',
            user: {
              mobile: result.mobile,
              role: result.role,
              otp_timestamp: 180,
              otp: dtm.otp,
            },
          });
        }
        return next(createError.BadRequest('Something Error!'));
      }
      const status = await StatusModel.findOne({
        userId: mongoose.Types.ObjectId(user._id),
      });
      if (!status) {
        return next(createError.BadRequest('User status not found!'));
      }
      if (status.is_blocked) {
        throw createError.BadRequest('Your account is blocked contact admin.');
      }
      if (!status.is_active) {
        throw createError.BadRequest('Your account is not active');
      }
      if (!status.is_approved) {
        throw createError.BadRequest(
          'Your account is not is_approved yet ! contact admin',
        );
      }
      const userRole = await RoleModel.findOne(
        { _id: user.role },
        {
          _id: 1,
          name: 1,
          role_type: 1,
        },
      );
      if (userRole) {
        if (userRole.role_type !== result.role_type) {
          throw createError.BadRequest('Your are not authorized to login here.');
        }
      } else {
        throw createError.BadRequest('Role not assigned. Contact admin.');
      }
      let oldUser = {};
      // eslint-disable-next-line max-len
      oldUser = await Model.updateOne({ _id: mongoose.Types.ObjectId(user._id) }, { $set: dtm });
      if (oldUser) {
        return res.status(200).json({
          success: true,
          status: 200,
          message: 'Otp send successfully.',
          user: {
            mobile: user.mobile,
            otp_timestamp: 180,
            role: user.role,
            otp: dtm.otp,
          },
        });
      }
      return next(createError.BadRequest('Something Error!'));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  },
  sendOtptoRegister: async (req, res, next) => {
    try {
      const result = req.body;
      if (result.role_type !== 'User') {
        return next(createError.BadRequest('Invalid Role Type!'));
      }
      // eslint-disable-next-line max-len
      const user = await Model.findOne({ mobile: result.mobile });
      const dtm = {
        otp: await generateOtp(4),
        otp_timestamp: otpTimeStamp(),
        otp_verified: false,
      };
      await sendOtp(result.mobile, dtm.otp)
      if (!user) {
        dtm.mobile = result.mobile;
        let savedRole = await RoleModel.findOne({ role_type: result.role_type }, { _id: 1 });
        if (savedRole) {
          result.role = savedRole._id;
          dtm.role = savedRole._id;
        } else {
          savedRole = await RoleModel.create(
            { name: result.role_type, role_type: result.role_type },
          );
          result.role = savedRole._id;
          dtm.role = savedRole._id;
        }
        const newUser = new Model(dtm);
        const savedUser = await newUser.save();
        console.log("newUser", newUser);
        // status
        await StatusModel.create({ user_id: newUser._id });
        if (savedUser) {
          return res.status(200).json({
            success: true,
            status: 200,
            message: 'Otp send successfully.',
            user: {
              mobile: result.mobile,
              role: result.role,
              otp_timestamp: 180,
              otp: dtm.otp,
            },
          });
        }
        return next(createError.BadRequest('Something Error!'));
      }
      const status = await StatusModel.findOne({
        user_id: mongoose.Types.ObjectId(user._id),
      });
      if (!status) {
        await StatusModel.create({ user_id: user._id });
      }
      // if (status.is_blocked) {
      //   throw createError.BadRequest('Your account is blocked contact admin.');
      // }
      // if (!status.is_active) {
      //   throw createError.BadRequest('Your account is not active');
      // }
      // if (!status.is_approved) {
      //   throw createError.BadRequest(
      //     'Your account is not is_approved yet ! contact admin',
      //   );
      // }
      const userRole = await RoleModel.findOne(
        { _id: mongoose.Types.ObjectId(user.role) },
        {
          _id: 1,
          name: 1,
          role_type: 1,
        },
      );
      if (userRole) {
        if (userRole.role_type !== result.role_type) {
          throw createError.BadRequest('Your are not authorized to login here.');
        }
      } else {
        throw createError.BadRequest('Role not assigned. Contact admin.');
      }
      let oldUser = {};
      // eslint-disable-next-line max-len
      oldUser = await Model.updateOne({ _id: mongoose.Types.ObjectId(user._id) }, { $set: dtm });
      if (oldUser) {
        return res.status(200).json({
          success: true,
          status: 200,
          message: 'Otp send successfully.',
          user: {
            mobile: user.mobile,
            otp_timestamp: 180,
            role: user.role,
            otp: dtm.otp,
          },
        });
      }
      return next(createError.BadRequest('Something Error!'));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  },
  verifyOtp: async (req, res, next) => {
    try {
      const result = req.body;
      const otp = await generateMobileOtp(4);
      const user = await Model.findOne({ mobile: result.mobile });
      const status = await StatusModel.findOne({ user_id: mongoose.Types.ObjectId(user._id) })
      console.log("user._id", user._id);
      if (!user) {
        throw createError.NotFound('User not available');
      }
      if (user.otp_verified) { throw createError.NotFound('Otp already verified.'); }
      const now = new Date();
      const then = new Date(user.otp_timestamp);
      const ms = moment(then, "YYYY-MM-DD'T'HH:mm:ss:SSSZ").diff(
        moment(now, "YYYY-MM-DD'T'HH:mm:ss:SSSZ"),
      );
      const d = moment.duration(ms);
      const s = d.format('dd:hh:mm:ss');
      if (!(user.otp_timestamp >= now)) {
        throw createError.NotAcceptable(`Time Out. ${s} Resend for new otp`);
      }
      const isMatch = await user.isValidOtp(result.otp);
      if (!isMatch) {
        throw createError.NotAcceptable('otp not valid');
      }
      await Model.updateOne(
        { _id: mongoose.Types.ObjectId(user._id) },
        { $set: { otp_verified: true, otp } },
      );
      const accessToken = await signAccessToken(user.id);
      console.log("status", status);
      const filteredStatus = {
        is_oldUser: user.is_oldUser,
        is_profile_1: status.is_profile_1,
        is_profile_2: status.is_profile_2,
        is_profile_3: status.is_profile_3,
        is_profile_4: status.is_profile_4,
        is_profile_5: status.is_profile_5,
        is_profile_6: status.is_profile_6,
      };
      return res.send({
        token: accessToken,
        id: user._id,
        status: filteredStatus,
        success: true,
        message: 'OTP VERIFIED SUCCESSFULLY',
      });
    } catch (error) {
      console.log(error);
      return next(error);
    }
  },
};
