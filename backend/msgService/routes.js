const wrap = require('../middleware/wrap');
const {upload} = require('../middleware/upload');

const routes = require('express').Router();

const path = require('path');
const {getHealth, sendEmail, getEmailStatus, handleFiles} = require(path.resolve(__dirname, 'controller'));

routes.get('/health', wrap(async function (req, res) {
  await getHealth(req, res);
}));

routes.post('/email', wrap(async function (req, res) {
  await sendEmail(req, res);
}));

routes.get('/email/:messageId/status', wrap(async function (req, res) {
  await getEmailStatus(req, res);
}));

routes.post('/uploads', upload, wrap(async function (req, res) {
  await handleFiles(req, res);
}));

module.exports = routes;
