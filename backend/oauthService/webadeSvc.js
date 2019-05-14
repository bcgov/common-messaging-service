const axios = require('axios');
const config = require('config');
const log = require('npmlog');

const utils = require('../components/utils');

const tokenUrl = config.get('services.cmsg.urls.token');

const webadeSvc = {
  getToken: async (username, password, scope) => {
    const response = await axios.get(tokenUrl, {
      auth: {
        username: username,
        password: password
      },
      params: {
        disableDeveloperFilter: true,
        grant_type: 'client_credentials',
        scope: scope
      }
    });

    log.verbose(utils.prettyStringify(response.data));

    if (!utils.responseOk(response.status)) {
      log.error('', 'Error getting OAuth token from %s: %d - %s', tokenUrl, response.status, response.statusText);
      throw Error('Could not connect OAuth server to authenticate Service: ' + response.statusText);
    }

    return response.data;
  },

  parseToken: (data) => {
    let token = undefined;
    let status = {
      credentialsGood: !data.error,
      credentialsAuthenticated: false
    };

    if (data.error) {
      if ('unauthorized' !== data.error || 'Bad credentials' !== data.error_description) {
        // unknown error, pass it along
        throw Error('Could not determine OAuth credentials: ' + data.error);
      }
    }

    if (status.credentialsGood) {
      status.credentialsAuthenticated = (data.access_token && data.access_token.length >= 16);
      if (!status.credentialsAuthenticated) {
        throw Error('Credentials for Service are not authenticated.  Access token is invalid.');
      }
      token = data.access_token;
    }

    return {token, status};
  }
};

module.exports = { webadeSvc };
