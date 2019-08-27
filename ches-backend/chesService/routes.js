const routes = require('express').Router();
const wrap = require('../middleware/wrap');

const {sendEmail} = require('./controller');

routes.get('/', wrap(function (req, res, next) {
  res.status(200).json({alive: true});
}));

routes.post('/email', wrap(async function (req, res, next) {
  await sendEmail(req, res, next);
}));

module.exports = routes;
