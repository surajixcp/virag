/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
const nodemailer = require('nodemailer');
const createError = require('http-errors');
const mongoose = require('mongoose');
const MailConf = require('../../models/emailSmsConfig.model');

module.exports = {
  sendMail: async ({
    to, cc, subject, body, attachments, id,
  }, callback) => {
    const mailConf = await MailConf.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(id) },
      },
    ]);
    if (!mailConf.length) {
      callback(createError.BadRequest('Mail not configured!'), null);
    }
    const result = mailConf[0];
    const transporter = nodemailer.createTransport({
      host: result.cred.host,
      port: result.cred.port,
      secure: true,
      auth: {
        user: result.cred.userId,
        pass: result.cred.password,
      },
    });
    console.log('filename: mail | line : 30', '===>', {
      host: result.cred.host,
      port: result.cred.port,
      secure: true,
      auth: {
        user: result.cred.userId,
        pass: result.cred.password,
      },
    });
    try {
      const info = await transporter.sendMail({
        from: result.cred.userId,
        to,
        cc,
        subject,
        html: body,
        attachments,
      });
      console.log('filename: mail | line : 48', '===>', info);
      callback('Mail Sent', info);
    } catch (error) {
      console.log('filename: mail | line : 51', '===>', error);
      callback(error, null);
    }
  },
};
