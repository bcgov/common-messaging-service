const config = require('config');
const log = require('npmlog');

const clientScopes = config.get('services.cmsg.scopes.all');
const clientId = config.get('services.cmsg.client.id');
const clientSecret = config.get('services.cmsg.client.secret');

const { webadeSvc } = require('../oauthService/webadeSvc');
const { cmsgSvc } = require('../msgService/cmsgSvc');

const getHealth = async (req, res) => {
  // need oauth token for our service client for the Common Messaging Service
  // need to check the credentials (valid/good, authenticated in env)
  // need to check the expected scopes (top level, create/send message)
  // finally need to ping the Common Messaging Service to see if it is up.

  try {
    let {token, status} = await login();
    status.cmsgApiHealthy = false;
    if (status.hasTopLevel) {
      status.cmsgApiHealthy = await cmsgSvc.healthCheck(token);
    }

    res.status(200).json(status);
  } catch (error) {
    log.error('msgServer.getStatus', error.message);
    res.status(500).json({error: {code: error.code, message: error.message}});
  }
};

const sendEmail = async (req, res) => {
  try {
    let {token, status} = await login();
    if (status.hasCreateMessage) {
      let {messageId} = await cmsgSvc.sendEmail(token, req.body);
      let response = await cmsgSvc.getEmailStatus(token, messageId);
      res.status(200).json(response);
    } else {
      res.status(401).json({error: {code: 401, message: 'Service is not authorized to send emails via Common Messaging Service'}});
    }

  } catch (error) {
    log.error('msgServer.getStatus', error.message);
    res.status(500).json({error: {code: error.code, message: error.message}});
  }
};

const getEmailStatus = async (req, res) => {
  try {
    let {token} = await login();
    let result = await cmsgSvc.getEmailStatus(token, req.params.messageId);
    res.status(200).json(result);

  } catch (error) {
    log.error('msgServer.getStatus', error.message);
    res.status(500).json({error: {code: error.code, message: error.message}});
  }
};

const login = async () => {
  let oauthData = await webadeSvc.getToken(clientId, clientSecret, clientScopes);
  let oauthResult = webadeSvc.parseToken(oauthData);
  let cmsgResult = cmsgSvc.parseScopes(oauthData);
  let status = {...oauthResult.status, ...cmsgResult.status};
  let token = oauthResult.token;
  return {token, status};
};

const handleFile = async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({error: {message: 'File expected, please upload a file.'}});
  } else {
    res.send(file);
  }
};

const handleFiles = async (req, res) => {
  res.status(200).json(req.files);
};

module.exports = {getHealth, sendEmail, getEmailStatus, handleFile, handleFiles};
