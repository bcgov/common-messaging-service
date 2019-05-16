const axios = require('axios');
const config = require('config');
const log = require('npmlog');

const fileUtils = require('../components/fileUtils');
const utils = require('../components/utils');

const ROOT_URL = config.get('services.cmsg.urls.root');
const MESSAGES_URL = `${ROOT_URL}messages`;

const cmsgSvc = {
  healthCheck: async (token) => {
    const response = await axios.get(ROOT_URL, {
      headers: {
        'Authorization':`Bearer ${token}`,
        'Content-Type':'application/json'
      }
    }
    );

    log.verbose(utils.prettyStringify(response.data));

    if (response.status !== 200) {
      log.error('', 'Error verifying Common Messaging API alive at %s: %d - %s', ROOT_URL, response.status, response.statusText);
      throw Error('Could not connect Common Messaging API: ' + response.statusText);
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

    let attachments = [];
    // save the incoming file names (if any)
    if (email.filenames) {
      attachments = await fileUtils.convertFiles(email.filenames);
      delete email.filenames;
    }

    const requestBody = { ...defaults, ...email };
    requestBody.recipients = email.recipients.replace(/\s/g, '').split(',');
    if (attachments && attachments.length > 0) {
      requestBody.attachments = attachments;
    }

    const response = await axios.post(
      MESSAGES_URL,
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
      log.error('', 'Error sending email to Common Messaging API at %s: %d - %s', MESSAGES_URL, response.status, response.statusText);
      throw Error('Could not send email through Common Messaging API: ' + response.statusText);
    }

    // we also expect the response to be of a certain type...  let's verify that.
    if (response.data['@type'] !== 'http://nrscmsg.nrs.gov.bc.ca/v1/accepted') {
      throw Error('Unexpected return from Common Messaging API: type returned = ' + response.data['@type']);
    }

    return cmsgSvc.parseMessageId(response.data);
  },

  getEmailStatus: async (token, messageId) => {
    const statusUrl = `${MESSAGES_URL}/${messageId}/statuses`;
    const response = await axios.get(statusUrl, {
      headers: {
        'Authorization':`Bearer ${token}`,
        'Content-Type':'application/json'
      }
    }
    );

    log.verbose(utils.prettyStringify(response.data));

    if (response.status !== 200) {
      log.error('', 'Error retreiving status from Common Messaging API at %s: %d - %s', statusUrl, response.status, response.statusText);
      throw Error('Could not retrieve email status from Common Messaging API: ' + response.statusText);
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
