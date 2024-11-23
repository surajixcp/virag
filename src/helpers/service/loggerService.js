/* eslint-disable linebreak-style */
const winston = require('winston');

const logLevels = {
  fatal: 0,
  crit: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

// eslint-disable-next-line max-len
// set default log level. Logs with log level below this won't be printed (as per logLevels defined above)
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const customColors = {
  trace: 'white',
  debug: 'green',
  info: 'green',
  warn: 'yellow',
  crit: 'blue',
  fatal: 'red',
};

const logger = winston.createLogger({
  level: LOG_LEVEL,
  levels: logLevels,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.prettyPrint(),
    winston.format.timestamp({
      format: 'DD-MM-YYYY hh:mm:ss A',
    }),
    winston.format.printf((nfo) => `${nfo.timestamp} - ${nfo.level}: ${nfo.message}`),
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

winston.addColors(customColors);

logger.stream = {
  write: (message) => {
    logger.info(message);
  },
};

// Extend logger object to properly log 'Error' types
const origLog = logger.log;

logger.log = (level, msg) => {
  const objType = Object.prototype.toString.call(msg);
  if (objType === '[object Error]') {
    origLog.call(logger, level, msg.toString());
  } else {
    origLog.call(logger, level, msg);
  }
};

module.exports = {
  logger,
};
