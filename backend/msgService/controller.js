const config = require('config');
const fileUtils = require('../components/fileUtils');
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

    // pass along configuration to the caller...
    // these could change from deployment to deployment, so allow caller to match up with what we can handle.
    status.attachmentsMaxSize = parseInt(config.get('server.uploads.fileSize'));
    status.attachmentsMaxFiles = parseInt(config.get('server.uploads.fileCount'));
    status.attachmentsAcceptedType = config.get('server.uploads.fileType');
    status.sender = config.get('services.cmsg.sender');

    res.status(200).json(status);
  } catch (error) {
    log.error('msgServer.getStatus', error.message);
    res.status(500).json({error: {code: error.code, message: error.message}});
  }
};

const sendEmail = async (req, res) => {
  let email = {};
  let filenames = [];
  let attachments = [];
  try {
    let {token, status} = await login();
    if (status.hasCreateMessage) {

      // extract what we need from the request
      email = req.body;
      filenames = email.filenames;
      // remove filenames field from email, we don't want to send this to the cmsg service.
      delete email.filenames;
      // convert our filenames to acceptable attachment model.
      if (filenames && filenames.length > 0) {
        attachments = await fileUtils.convertFiles(filenames);
      }
      // send the email and attachements
      let {messageId} = await cmsgSvc.sendEmail(token, email, attachments);
      // return the status from cmsg
      let response = await cmsgSvc.getEmailStatus(token, messageId);
      res.status(200).json(response);
    } else {
      res.status(401).json({error: {code: 401, message: 'Service is not authorized to send emails via Common Messaging Service'}});
    }

  } catch (error) {
    log.error('msgServer.getStatus', error.message);
    res.status(500).json({error: {code: error.code, message: error.message}});
  } finally {
    // check for presence of uploaded files, delete them if they exist....
    if (filenames && filenames.length >0) {
      await fileUtils.deleteFiles(filenames);
    }
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

const handleFiles = async (req, res) => {
  res.status(200).json(req.files);
};

module.exports = {getHealth, sendEmail, getEmailStatus, handleFiles};
