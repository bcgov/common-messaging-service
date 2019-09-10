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

  async checks() {
    try {
      const response = await this.axios.get(
        `${this.apiUrl}/checks/status`,
        {
          headers: {
            'Content-Type':'application/json'
          }
        }
      );
      return response.data;
    } catch (e) {
      if (e.response) {
        log.error(`Error from CHES: status = ${e.response.status}, data : ${JSON.stringify(e.response.data, null, 2)}`);
        throw new Problem(e.response.status, 'CHES Error', {detail: e.response.data.detail});
      } else {
        log.error(`Unknown error calling CHES: ${e.message}`);
        throw new Problem(500, 'Unknown CHES Error', {detail: e.message});
      }
    }
  }

  async send(email) {
    try {
      const response = await this.axios.post(
        `${this.apiUrl}/email`,
        email,
        {
          headers: {
            'Content-Type':'application/json'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      return response.data;
    } catch (e) {
      if (e.response) {
        log.error(`Error from CHES: status = ${e.response.status}, data : ${JSON.stringify(e.response.data, null, 2)}`);
        throw new Problem(e.response.status, 'CHES Error', {detail: e.response.data.detail});
      } else {
        log.error(`Unknown error calling CHES: ${e.message}`);
        throw new Problem(500, 'Unknown CHES Error', {detail: e.message});
      }
    }
  }


  async merge(data) {
    try {
      const response = await this.axios.post(
        `${this.apiUrl}/email/merge`,
        data,
        {
          headers: {
            'Content-Type':'application/json'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      return response.data;
    } catch (e) {
      if (e.response) {
        log.error(`Error from CHES: status = ${e.response.status}, data : ${JSON.stringify(e.response.data, null, 2)}`);
        throw new Problem(e.response.status, 'CHES Error', {detail: e.response.data.detail});
      } else {
        log.error(`Unknown error calling CHES: ${e.message}`);
        throw new Problem(500, 'Unknown CHES Error', {detail: e.message});
      }
    }
  }

  async preview(data) {
    try {
      const response = await this.axios.post(
        `${this.apiUrl}/email/merge/preview`,
        data,
        {
          headers: {
            'Content-Type':'application/json'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      return response.data;
    } catch (e) {
      if (e.response) {
        log.error(`Error from CHES: status = ${e.response.status}, data : ${JSON.stringify(e.response.data, null, 2)}`);
        throw new Problem(e.response.status, 'CHES Error', {detail: e.response.data.detail});
      } else {
        log.error(`Unknown error calling CHES: ${e.message}`);
        throw new Problem(500, 'Unknown CHES Error', {detail: e.message});
      }
    }
  }

}

module.exports = ChesService;
