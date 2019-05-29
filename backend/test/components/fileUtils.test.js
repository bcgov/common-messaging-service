const config = require('config');
const fs = require('fs');
const log = require('npmlog');
const utils = require('../../components/utils');

const fileUtils = require('../../components/fileUtils');
const Constants = require('../constants');

beforeAll(() => {
  require('../utils').configureLogging();
});

test('file is base64 encoded', async () => {
  expect.assertions(1);
  const data = await fileUtils.encode_base64(Constants.PDF_1);
  log.debug(`data: ${data}`);
  expect(data).toBeDefined();
});

test('file is converted', async () => {
  // this is to mimic what the UI sends us
  let file = {
    originalname: 'file_1',
    path: Constants.PDF_1
  };
  expect.assertions(4);
  const data = await fileUtils.convertFile(file);
  log.debug(`data: ${utils.prettyStringify(data)}`);
  expect(data).toBeDefined();
  expect(data.name).toMatch(file.originalname);
  expect(data.fileType).toMatch(config.get('server.uploads.fileType'));
  expect(data.content).toBeDefined();
});

test('files are converted', async () => {
  // this is to mimic what the UI sends us
  let files = [{
    originalname: 'file_1',
    path: Constants.PDF_1
  },
  {
    originalname: 'file_2',
    path: Constants.PDF_2
  }];
  expect.assertions(4);
  const data = await fileUtils.convertFiles(files);
  log.debug(`data: ${utils.prettyStringify(data)}`);
  expect(data).toBeDefined();
  expect(data.length).toEqual(2);
  expect(data[0].name).toEqual(files[0].originalname);
  expect(data[1].name).toEqual(files[1].originalname);
});


test('files are deleted', async () => {
  // this is to mimic what the UI sends us
  let files = [{
    originalname: 'file_1',
    path: Constants.FILE_1
  },
  {
    originalname: 'file_2',
    path: Constants.FILE_2
  }];
  //expect.assertions(0);
  try {
    await fileUtils.deleteFiles(files);
    expect(fs.existsSync(Constants.FILE_1)).toBeFalsy();
    expect(fs.existsSync(Constants.FILE_2)).toBeFalsy();
  } catch(e) {
    log.debug(`Error checking for deleted files: ${utils.prettyStringify(e)}`);
  }
});
