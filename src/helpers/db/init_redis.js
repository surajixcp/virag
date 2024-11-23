/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
const { createClient } = require('redis');
const { logger } = require('../service/loggerService');

/*
By default, redis.createClient() will use 127.0.0.1 and 6379 as the hostname and port respectively.
If you have a different host/port, you can supply them like so:
const client = redis.createClient(port, host);
* */
const client = createClient();
client.connect();

client.on('connect', () => {
  logger.info('Client connected to redis...');
});

client.on('ready', () => {
  logger.info('Client connected to redis and ready to use...');
});

client.on('error', (err) => {
  logger.fatal(err.message);
});

client.on('end', () => {
  logger.warn('Client disconnected from redis');
});

process.on('SIGINT', () => {
  client.quit();
});

module.exports = client;
