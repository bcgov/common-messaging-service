const config = require('config');
const fs = require('fs');
const log = require('npmlog');

const Constants = require('./constants');

module.exports = async () => {
  log.info('> globalSetup');
  log.info('  create uploads path if not exist');
  try {
    if (!fs.existsSync(config.get('server.uploads.path'))){
      fs.mkdirSync(config.get('server.uploads.path'));
    }
  } catch (err) {
    log.error(err);
  }
  log.info('  create 2 dummy files');
  try {
    fs.writeFileSync(Constants.FILE_1, 'This is a dummy file.');
    fs.writeFileSync(Constants.FILE_2, 'This is a dummy file.  This is a dummy file.');
  } catch (err) {
    log.error(err);
  }
  log.info('< globalSetup');
};
