/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
/* eslint-disable no-console */

// Init the environment variables and server configurations
// eslint-disable-next-line import/no-unresolved
require('dotenv').config();
const { startServer } = require('./app');
const { logger } = require('./helpers/service/loggerService');
const config = require('./helpers/environment/config');

const SLEEP_TIME = process.env.SLEEP_TIME || 3000;

// sleep till MongoDB and RabbitMQ services start
logger.info(`Sleeping for ${SLEEP_TIME}ms before connecting to MongoDB.`);
setTimeout(() => {
  startServer();
  logger.info(`${config.name} ${config.moduleName} started in ${config.environment}`);
}, SLEEP_TIME);
