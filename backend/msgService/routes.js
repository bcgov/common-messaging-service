const wrap = require('../middleware/wrap');
const routes = require('express').Router();

const path = require('path');
const {getStatus, getConfig, sendEmail, getEmailStatus} = require(path.resolve(__dirname, 'controller'));

routes.get('/status', wrap(async function (req, res) {
  await getStatus(req, res);
}));

routes.get('/config', wrap(async function (req, res) {
  await getConfig(req, res);
}));

routes.post('/email', wrap(async function (req, res) {
  await sendEmail(req, res);
}));

routes.get('/email/:messageId/status', wrap(async function (req, res) {
  await getEmailStatus(req, res);
}));
module.exports = routes;
