/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
const JWT = require('jsonwebtoken');
const createError = require('http-errors');
const mongoose = require('mongoose');
const User = require('../../models/user.model');
const Role = require('../../models/role.model');
// const permissionUrls = [];

module.exports = {
  signAccessTokenAdmin: (userId) => new Promise((resolve, reject) => {
    console.log(userId)
    const payload = {};
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const options = {
      expiresIn: '30d',
      issuer: process.env.DOMAIN,
      audience: userId,
    };
    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        console.log(err);
        reject(createError.InternalServerError());
        return;
      }
      resolve(token);
    });
  }),
  verifyAccessTokenAdmin: (req, res, next) => {
    if (!req.headers.authorization) return next(createError.Unauthorized());
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader.split(' ');
    const token = bearerToken[1];
    return JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, payload) => {
      if (err) {
        const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
        return next(createError.Unauthorized(message));
      }
      // eslint-disable-next-line max-len
      const user = await User.findOne({ _id: mongoose.Types.ObjectId(payload.aud) }, { __v: 0, updated_record: 0 });
      if (!user) return next(createError.Unauthorized('User not available'));
      // console.log(user , payload.aud, 'user');
      const role = await Role.findOne({ _id: user.roleId }, { __v: 0, updated_record: 0 });
      if (!role) return next(createError.Unauthorized('Role not assigned'));
      req.user = user;
      req.role = role;
      // const permissionData = permissionUrls.filter((o) => o.path === req.originalUrl).pop();
      // eslint-disable-next-line max-len
      // if (permissionData && !(req.role.permission[permissionData.permission[0]][permissionData.permission[1]])) {
      //   const message = 'Unauthorized'
      //   return next(createError.Unauthorized(message))
      // }
      req.payload = payload;
      return next();
    });
  },
  signRefreshTokenAdmin: (userId) => new Promise((resolve, reject) => {
    const payload = {};
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const options = {
      expiresIn: '1y',
      issuer: process.env.DOMAIN,
      audience: userId,
    };
    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        reject(createError.InternalServerError());
      }
      resolve(token);
      // client.SET(userId, token, 'EX', 365 * 24 * 60 * 60, (errs, reply) => {
      //   if (errs) {
      //     console.log(err.message);
      //     reject(createError.InternalServerError());
      //     return;
      //   }
      //   console.log(reply);
      //   resolve(token);
      // })
    });
  }),
  verifyRefreshTokenAdmin: (refreshToken) => new Promise((resolve, reject) => {
    JWT.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, payload) => {
        if (err) return reject(createError.Unauthorized());
        // eslint-disable-next-line max-len
        const user = await User.findOne({ _id: mongoose.Types.ObjectId(payload.aud) }, { __v: 0, updated_record: 0 });
        // eslint-disable-next-line no-underscore-dangle
        return resolve(user.id);
      },
    );
  }),
};
