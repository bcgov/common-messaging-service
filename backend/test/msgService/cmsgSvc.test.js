const config = require('config');
const log = require('npmlog');
const utils = require('../../components/utils');

const clientScopes = config.get('services.cmsg.scopes.all');
const clientId = config.get('services.cmsg.client.id');
const clientSecret = config.get('services.cmsg.client.secret');

const { configureLogging, generateUUID } = require('../utils');

const { webadeSvc } = require('../../oauthService/webadeSvc');

const { cmsgSvc } = require('../../msgService/cmsgSvc');

let accessToken = undefined;

beforeAll(async () => {
  configureLogging();
  const oauthData = await webadeSvc.getToken(clientId, clientSecret, clientScopes);
  let {token} = webadeSvc.parseToken(oauthData);
  accessToken = token;
});

test('health check', async () => {
  log.debug('> healthcheck');
  expect.assertions(1);

  const data = await cmsgSvc.healthCheck(accessToken);
  log.debug(`data: ${utils.prettyStringify(data)}`);
  expect(data).toBeTruthy();
  log.debug('< healthcheck');
});

test('send good email', async () => {
  log.debug('> send email');
  expect.assertions(3);

  let recipient = `${generateUUID()}@${generateUUID()}.org`;

  const email = {
    sender: config.get('services.cmsg.sender'),
    subject: 'unit test',
    recipients: recipient,
    message: 'from a unit test',
    mediaType: 'text/plain'
  };
  const data = await cmsgSvc.sendEmail(accessToken, email);
  log.debug(`data: ${utils.prettyStringify(data)}`);
  expect(data).toBeDefined();
  expect(data.messageId).toBeDefined();
  expect(data.href).toBeDefined();
  log.debug('< send email');
});

test('check status of good email', async () => {
  log.debug('> send email');

  expect.assertions(5);

  let recipient = `${generateUUID()}@${generateUUID()}.org`;

  const email = {
    sender: config.get('services.cmsg.sender'),
    subject: 'unit test',
    recipients: recipient,
    message: 'from a unit test',
    mediaType: 'text/plain'
  };
  const data = await cmsgSvc.sendEmail(accessToken, email);
  log.debug(`data: ${utils.prettyStringify(data)}`);
  expect(data).toBeDefined();
  expect(data.messageId).toBeDefined();
  expect(data.href).toBeDefined();

  const statusData = await cmsgSvc.getEmailStatus(accessToken, data.messageId);
  log.debug(`statusData: ${utils.prettyStringify(statusData)}`);
  expect(statusData).toBeDefined();
  expect(statusData['@type']).toEqual('StatusListResource');
  log.debug('< send email');
});
