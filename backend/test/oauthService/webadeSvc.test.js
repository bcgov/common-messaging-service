const config = require('config');
const log = require('npmlog');
const utils = require('../../components/utils');

const clientScopes = config.get('services.cmsg.scopes.all');
const clientId = config.get('services.cmsg.client.id');
const clientSecret = config.get('services.cmsg.client.secret');

const { webadeSvc } = require('../../oauthService/webadeSvc');

beforeAll(() => {
  require('../utils').configureLogging();
});

test('token is fetched', async () => {
  log.debug('> getToken test');
  expect.assertions(6);
  log.debug(`params: ${clientId}, ${clientSecret}, ${clientScopes}`);
  log.debug('  ...getToken');
  const data = await webadeSvc.getToken(clientId, clientSecret, clientScopes);
  log.debug(`data: ${utils.prettyStringify(data)}`);
  expect(data.error).toBe(undefined);

  log.debug('  ...parseToken');
  let {token, status} = webadeSvc.parseToken(data);
  log.debug(`token: ${token}`);
  log.debug(`status: ${utils.prettyStringify(status)}`);
  expect(token).toBeDefined();
  expect(token.length).toBeGreaterThanOrEqual(16);
  expect(status).toBeDefined();
  expect(status.credentialsAuthenticated).toBeTruthy();
  expect(status.credentialsGood).toBeTruthy();
  log.debug('< getToken test');
});
