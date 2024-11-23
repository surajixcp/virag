/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
const mongoose = require('mongoose');
const { logger } = require('../service/loggerService');
const config = require('../environment/config');
// environment variables
const MONGO_URI = config.db_uri;
/**
 * Connect to MongoDB
 */
const mongoConnect = () => {
  mongoose.Promise = global.Promise;
  mongoose.set('strictQuery', true);
  mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err) => {
    if (err) {
      logger.fatal(err);
      logger.warn(err.stack);
    }
  });
  mongoose.connection.on('connected', () => {
    logger.info(`Mongoose - connection established at ${process.env.DB_NAME}`);
  });

  // If the connection throws an error
  mongoose.connection.on('error', (err) => {
    logger.fatal(err);
    logger.fatal(`Mongoose - connection error: ${MONGO_URI}`);
  });

  // When the connection is disconnected
  mongoose.connection.on('disconnected', () => {
    logger.fatal(`Mongoose - disconnected: ${MONGO_URI}`);
  });
};

module.exports = {
  mongoConnect,
};
