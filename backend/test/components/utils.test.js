const log = require('npmlog');
const utils = require('../../components/utils');

beforeAll(() => {
  require('../utils').configureLogging();
});

test('prettify works', async () => {
  expect.assertions(1);
  const data = utils.prettyStringify({str: 'string', num: 2, arr: [{str: 's', num: 0}], udef: null});
  log.debug(`data: ${data}`);
  expect(data).toBeDefined();
});

test('responseOk lower boundary', async () => {
  expect.assertions(2);
  expect(utils.responseOk(200)).toBeTruthy();
  expect(utils.responseOk(199)).toBeFalsy();
});

test('responseOk upper boundary', async () => {
  expect.assertions(2);
  expect(utils.responseOk(299)).toBeTruthy();
  expect(utils.responseOk(300)).toBeFalsy();
});
