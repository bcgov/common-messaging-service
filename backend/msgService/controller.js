const config = require('config');
const axios = require('axios');

const tokenUrl = config.services.cmsg.urls.token;
const clientId = config.services.cmsg.client.id;
const clientSecret = config.services.cmsg.client.secret;


const getToken = async (req, res) => {
  try {
    let data = await fetchToken();
    let {token, credentialsGood, credentialsAuthenticated, hasTopLevel, hasCreateMessage} = parseToken(data);
    res.status(200).json({
      token: token,
      credentialsGood: credentialsGood,
      credentialsAuthenticated: credentialsAuthenticated,
      hasTopLevel: hasTopLevel,
      hasCreateMessage: hasCreateMessage
    });
  } catch (e) {
    res.status(500).json({error: {code: e.code, message: e.message}});
  }

};

const fetchToken = async () => {
  const response = await axios.request({
    method: 'get',
    url: tokenUrl,
    auth: {
      username: clientId,
      password: clientSecret
    }
  });
  if (response.status !== 200) {
    throw Error('Could not fetch OAuth token: ' + response.statusText);
  }
  return response.data;
};

const parseToken = (data) => {
  let token = undefined;
  let credentialsAuthenticated = false;
  let hasTopLevel = false;
  let hasCreateMessage = false;
  let credentialsGood = !data.error;

  if (data.error) {
    if ('unauthorized' !== data.error || 'Bad credentials' !== data.error_description) {
      // unknown error, pass it along
      throw Error('Could not determine OAuth credentials: ' + data.error);
    }
  }

  if (credentialsGood) {
    credentialsAuthenticated = (data.access_token && data.access_token.length >= 16);
    if (!credentialsAuthenticated) {
      throw Error('Credentials are not authenticated.  Access token is invalid.');
    }
    token = data.access_token;
    hasTopLevel = (data.scope.split(' ').indexOf('CMSG.GETTOPLEVEL') >= 0);
    hasCreateMessage = (data.scope.split(' ').indexOf('CMSG.CREATEMESSAGE') >= 0);
  }

  return {token, credentialsGood, credentialsAuthenticated, hasTopLevel, hasCreateMessage};
};


const getConfig = async (req, res) => {
  let result = {
    configs: [{
      urls: config.services.cmsg.urls,
      clientId: clientId,
      default: true,
      name: 'Integration'
    }]
  };
  res.status(200).json(result);
};

module.exports = {getToken, getConfig};
