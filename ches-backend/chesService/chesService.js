const log = require('npmlog');
const Problem = require('api-problem');

const ClientConnection = require('./clientConnection');

class ChesService {
  constructor({tokenUrl, clientId, clientSecret, apiUrl}) {
    log.info('ChesService ', `${tokenUrl}, ${clientId}, secret, ${apiUrl}`);
    if (!tokenUrl || !clientId || !clientSecret || !apiUrl) {
      log.error('ChesService - invalid configuration.');
      throw new Error('ChesService is not configured.  Check configuration.');
    }
    this.connection = new ClientConnection({tokenUrl, clientId, clientSecret});
    this.axios = this.connection.axios;
    this.apiUrl = apiUrl;
  }

  async send(email) {
    const response = await this.axios.post(
      `${this.apiUrl}/email`,
      JSON.stringify(email),
      {
        headers: {
          'Content-Type':'application/json'
        }
      }
    ).catch(e => {
      // we could be getting specific errors back from cmsg.
      log.error(`Error from CHES: status = ${e.response.status}, msg = ${e.response.statusText}`);
      throw new Problem(e.response.status, 'CHES Email Message error', {detail: e.message});
    });

    // eslint-disable-next-line no-console
    console.log(response);
    return response.data;
  }
}

module.exports = ChesService;
