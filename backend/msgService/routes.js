const wrap = require('../middleware/wrap');
const routes = require('express').Router();

const path = require('path');
const {getToken, getConfig} = require(path.resolve( __dirname, 'controller'));

routes.get('/token', wrap(async function (req, res) {
  await getToken(req, res);
}));

routes.get('/config', wrap(async function (req, res) {
  await getConfig(req, res);
}));

module.exports = routes;
