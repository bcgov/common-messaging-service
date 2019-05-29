const config = require('config');
const log = require('npmlog');

const configureLogging = () => {
  log.level = config.get('server.logLevel');
  log.addLevel('debug', 1500, { fg: 'green' });
};

const generateUUID = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

module.exports = { configureLogging, generateUUID };
