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
    try {
      const response = await this.axios.post(
        `${this.apiUrl}/email`,
        email,
        {
          headers: {
            'Content-Type':'application/json'
          }
        }
      );
      return response.data;
    } catch (e) {
      log.error(`Error from CHES: status = ${e.response.status}, data : ${JSON.stringify(e.response.data, null, 2)}`);
      throw new Problem(e.response.status, 'CHES Error', {detail: e.response.data.detail});
    }
  }
}

module.exports = ChesService;
