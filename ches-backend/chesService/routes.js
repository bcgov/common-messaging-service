const {relatedLinks} = require('../components/relatedLinks');
const routes = require('express').Router();
const wrap = require('../middleware/wrap');

const {sendEmail} = require('./controller');

routes.get('/', wrap(function (req, res) {
  res.status(200).json({
    links: relatedLinks.createLinks(req, [
      {r:'email', m:'POST', p:'/email'}
    ])
  });
}));

routes.post('/email', wrap(async function (req, res, next) {
  await sendEmail(req, res, next);
}));

module.exports = routes;
