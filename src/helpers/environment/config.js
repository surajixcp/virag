/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
// eslint-disable-next-line import/no-unresolved
require('dotenv').config();
const config = {
  name: 'viraag',
  moduleName: 'Api viraag',
  baseAPIRoute: 'api',
  port: process.env.PORT || 8080,
  environment: process.env.NODE_ENV || 'development',
  db_uri: `mongodb+srv://sazid:${process.env.DB_PASSWORD}@viraag-services.yv2v7px.mongodb.net/viraag-services?retryWrites=true&w=majority&appName=viraag-services` || 'mongodb://localhost:27017/viraag-services',
  // db_uri: `mongodb+srv://sazid:${process.env.DB_PASSWORD}@viraag-services.wxpyyxu.mongodb.net/` || 'mongodb://localhost:27017/viraag-services',
  messageTimeout: 500,
  jwtsecret: 'dc39cc808a5f602247c8b41e4f8229cf84c0bd3d0b91be43fdd61ab81ec3d9111',
};

config.startedMessage = `${config.name} ${config.moduleName} is running on port ${config.port}`;

module.exports = config;
