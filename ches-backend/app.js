const bodyParser = require('body-parser');
const config = require('config');
const cors = require('cors');
const express = require('express');
const log = require('npmlog');
const morgan = require('morgan');
const Problem = require('api-problem');

const chesService = require('./chesService/routes');
const utils = require('./components/utils');

const state = {
  isShutdown: false
};

const app = express();

app.use(bodyParser.json({limit: config.get('server.requestSizeLimit')}));
app.use(bodyParser.urlencoded({limit: config.get('server.requestSizeLimit'), extended: true}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(cors());
app.options('*', cors());

app.use(morgan(config.get('server.morganFormat')));

log.level = config.get('server.logLevel');
log.addLevel('debug', 1500, { fg: 'green' });

// Print out configuration settings in verbose startup
log.verbose(utils.prettyStringify(config));

app.use('/ches/v1', chesService);

// Handle 500
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
  if (err.stack) {
    log.error(err.stack);
  }

  if (err instanceof Problem) {
    err.send(res, null);
  } else {
    let p = new Problem(500, 'MSSC-CHES Server Error', { detail: err.message } );
    p.send(res, null);
  }
});

// Handle 404
app.use(function (req, res) {
  let p = new Problem(404, 'Page Not Found', { detail: req.originalUrl } );
  p.send(res, null);
});

// Prevent unhandled errors from crashing application
process.on('unhandledRejection', err => {
  log.error(err.stack);
});

// Graceful shutdown support
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  if (!state.isShutdown) {
    log.info('Received kill signal...');
    log.info('...Time to die.');
    state.isShutdown = true;
    //
    // if we had a db connection, we would shut it down here.
    //
    // Wait 3 seconds before hard exiting
    setTimeout(() => process.exit(), 3000);
  }
}

module.exports = app;
