const config = require('config');
const fs = require('fs');
const log = require('npmlog');

const rmDir = (dir, rmSelf)  => {
  var files;
  rmSelf = (rmSelf === undefined) ? true : rmSelf;
  dir = dir + '/';
  try { files = fs.readdirSync(dir); } catch (e) { log.error('!Oops, directory not exist.'); return; }
  if (files.length > 0) {
    files.forEach(function(x) {
      if (fs.statSync(dir + x).isDirectory()) {
        rmDir(dir + x);
      } else {
        fs.unlinkSync(dir + x);
      }
    });
  }
  if (rmSelf) {
    // check if user want to delete the directory ir just the files in this directory
    fs.rmdirSync(dir);
  }
};

module.exports = async () => {
  log.info('> globalTeardown');
  log.info('  delete uploads path');
  rmDir(config.get('server.uploads.path'), true);
  log.info('< globalTeardown');
};
