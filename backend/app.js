const config = require('config');
const express = require('express');
const log = require('npmlog');
const morgan = require('morgan');

const msgService = require('./msgService/routes');
const utils = require('./components/utils');

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(morgan(config.get('server.morganFormat')));

log.level = config.get('server.logLevel');
log.addLevel('debug', 1500, { fg: 'green' });

// Print out configuration settings in verbose startup
log.verbose(utils.prettyStringify(config));

// expose our service at this end point.
app.use('/api/v1', msgService);


// Handle 500
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
  res.status(500);
  res.json({
    status: 500,
    message: err.stack.split('\n', 1)[0]
  });
});

// Handle 404
app.use(function (req, res) {
  res.status(404);
  res.json({
    status: 404,
    message: 'Page Not Found'
  });
});

// Prevent unhandled errors from crashing application
process.on('unhandledRejection', err => {
  log.error(err.stack);
});

module.exports = app;
