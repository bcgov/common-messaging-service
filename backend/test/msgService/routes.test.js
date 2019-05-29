const config = require('config');
const express = require('express');
const log = require('npmlog');
const request = require('supertest');
const utils = require('../../components/utils');
const msgService = require('../../msgService/routes');
const { configureLogging, generateUUID } = require('../utils');
const Constants = require('../constants');

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use('/mssc/v1', msgService);

beforeAll(() => {
  configureLogging();
});

describe('GET /health', function() {
  it('responds with json', function(done) {
    request(app)
      .get('/mssc/v1/health')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => log.debug(utils.prettyStringify(res)))
      .expect(200, done);
  });
});

describe('POST /email', function() {
  it('responds with json', function(done) {
    let recipient = `${generateUUID()}@${generateUUID()}.org`;
    const email = {
      sender: config.get('services.cmsg.sender'),
      subject: 'unit test',
      recipients: recipient,
      message: 'from a unit test',
      mediaType: 'text/plain'
    };
    request(app)
      .post('/mssc/v1/email')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(email))
      .expect('Content-Type', /json/)
      .expect((res) => log.debug(utils.prettyStringify(res)))
      .expect(200, done);
  });
});

describe('POST /uploads', function() {
  it('responds with json', function(done) {
    request(app)
      .post('/mssc/v1/uploads')
      .attach('files', Constants.PDF_1)
      .attach('files', Constants.PDF_2)
      .expect('Content-Type', /json/)
      .expect((res) => log.debug(utils.prettyStringify(res)))
      .expect(200, done);
  });
});

describe('POST large PDF to /uploads', function() {
  it('responds with json - rejection', function(done) {
    request(app)
      .post('/mssc/v1/uploads')
      .attach('files', Constants.PDF_TOO_BIG)
      .expect((res) => log.debug(utils.prettyStringify(res)))
      .expect(500, done);
  });
});

describe('POST too many files to /uploads', function() {
  it('responds with json - rejection', function(done) {
    request(app)
      .post('/mssc/v1/uploads')
      .attach('files', Constants.PDF_1)
      .attach('files', Constants.PDF_2)
      .attach('files', Constants.PDF_1)
      .attach('files', Constants.PDF_2)
      .expect((res) => log.debug(utils.prettyStringify(res)))
      .expect(500, done);
  });
});
