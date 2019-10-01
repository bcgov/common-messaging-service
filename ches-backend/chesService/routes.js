const config = require('config');
const keycloak = require('../components/keycloak');
const {relatedLinks} = require('../components/relatedLinks');
const routes = require('express').Router();
const wrap = require('../middleware/wrap');

const {sendEmail, emailMerge, emailPreview} = require('./controller');

// this is our authorization middleware function
// users always need the email_sender role to send
// and they will need the sender_editor role if they've overridden our expected default sender/from.
function protectEmail(token, req) {
  const hasEmailSender = token.hasRole('mssc:email_sender');
  const hasSenderEditor = token.hasRole('mssc:sender_editor');
  const defaultSender = config.get('server.defaultSender');
  let sender = '';
  try {
    sender = req.body.from;
  } catch (e) {
    sender = '';
  }

  return hasEmailSender && (sender === defaultSender || hasSenderEditor);
}

routes.get('/', wrap(function (req, res) {
  res.status(200).json({
    links: relatedLinks.createLinks(req, [
      {r: 'email', m: 'POST', p: '/email'}
    ])
  });
}));

routes.post('/email', keycloak.protect(protectEmail), wrap(async function (req, res, next) {
  await sendEmail(req, res, next);
}));


routes.post('/email/merge', keycloak.protect(protectEmail), wrap(async function (req, res, next) {
  await emailMerge(req, res, next);
}));

routes.post('/email/merge/preview', keycloak.protect(protectEmail), wrap(async function (req, res, next) {
  await emailPreview(req, res, next);
}));

module.exports = routes;
