const express = require('express');
const msgService = require('./msgService/routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use('/mssc/v1', msgService);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('./static'));
}

// Handle 500
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
  res.status(500);
  res.json({
    status: 500,
    message: 'Internal Server Error: ' + err.stack.split('\n', 1)[0]
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

module.exports = app;
