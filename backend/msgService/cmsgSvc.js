const axios = require('axios');
const config = require('config');
const log = require('npmlog');

const utils = require('../components/utils');

const urls = {
  root: config.get('services.cmsg.urls.root'),
  messages: config.get('services.cmsg.urls.messages')
};

const cmsgSvc = {
  healthCheck: async (token) => {
    const response = await axios.get(urls.root, {
      headers: {
        'Authorization':`Bearer ${token}`,
        'Content-Type':'application/json'
      }
    }
    );

    log.verbose(utils.prettyStringify(response.data));

    if (response.status !== 200) {
      log.error('', 'Error verifying Common Messaging Service alive at %s: %d - %s', urls.root, response.status, response.statusText);
      throw Error('Could not connect Common Messaging Service: ' + response.statusText);
    }

    return response.data['@type'] === 'http://nrscmsg.nrs.gov.bc.ca/v1/endpoints';
  },

  sendEmail: async (token, email) => {
    const defaults = {
      '@type' : 'http://nrscmsg.nrs.gov.bc.ca/v1/emailMessage',
      'links': [
      ],
      'delay': 0,
      'expiration': 0,
      'maxResend': 0
    };

    const requestBody = { ...defaults, ...email };
    requestBody.recipients = email.recipients.replace(/\s/g, '').split(',');

    const response = await axios.post(
      urls.messages,
      JSON.stringify(requestBody),
      {
        headers: {
          'Authorization':`Bearer ${token}`,
          'Content-Type':'application/json'
        }
      }
    );

    log.verbose(utils.prettyStringify(response.data));

    if (response.status !== 202) {
      log.error('', 'Error sending email to Common Messaging Service at %s: %d - %s', urls.root, response.status, response.statusText);
      throw Error('Could not send email through Common Messaging Service: ' + response.statusText);
    }

    // we also expect the response to be of a certain type...  let's verify that.
    if (response.data['@type'] !== 'http://nrscmsg.nrs.gov.bc.ca/v1/accepted') {
      throw Error('Unexpected return from Common Messaging Service: type returned = ' + response.data['@type']);
    }

    return cmsgSvc.parseMessageId(response.data);
  },

  getEmailStatus: async (token, messageId) => {
    const statusUrl = `${urls.messages}/${messageId}/statuses`;
    const response = await axios.get(statusUrl, {
      headers: {
        'Authorization':`Bearer ${token}`,
        'Content-Type':'application/json'
      }
    }
    );

    log.verbose(utils.prettyStringify(response.data));

    if (response.status !== 200) {
      log.error('', 'Error verifying Common Messaging Service alive at %s: %d - %s', urls.root, response.status, response.statusText);
      throw Error('Could not connect Common Messaging Service: ' + response.statusText);
    }

    return response.data;
  },

  parseScopes: (data) => {
    let status = {
      hasTopLevel: false,
      hasCreateMessage: false
    };
    status.hasTopLevel = (data.scope.split(' ').indexOf(config.get('services.cmsg.scopes.topLevel')) >= 0);
    status.hasCreateMessage = (data.scope.split(' ').indexOf(config.get('services.cmsg.scopes.createMessage')) >= 0);

    return {status};
  },

  parseMessageId: (data) => {
    let splitHref = data.links[0].href.split('/').reverse();
    // expect statuses / messageId / messages / <path>
    return { messageId: splitHref[1], href: data.links[0].href };
  }

};

module.exports = { cmsgSvc };
