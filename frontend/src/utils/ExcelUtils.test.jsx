import * as ExcelUtils from './ExcelUtils';
import moment from 'moment';

const goodData = 'Greeting,Scope,#!@&*Quote (?!),Source,Start Date,End Date TS,To,Cc,Bcc,Tag,Delay TS\n' +
  'Hello,World,You speak an infinite deal of nothing.,William Shakespeare,10/4/2019,10/6/2019 1:45 PM,"hamlet@dane.xyz, king@lear.xyz",julius@caesar.xyz,,the bard,Oct 4 2019 14:45\n' +
  'Bonjour,Monde,"These violent delights have violent ends and in their triumph die, like fire and powder which, as they kiss, consume.",William Shakespeare,Oct 4 2019,Oct 6 2019 13:45,king@james.one,sir@walter.xyz,,the bard,\n' +
  'Ciao,Mondo,Conscience doth make cowards of us all.,William Shakespeare,4 Oct 2019, 6 Oct 2019 13:45,christopher@marlowe.xyz,,,the bard,\n' +
  'Hola,Mundo,A true patriot will defend his country from its government.,Thomas Jefferson,10-4-19 13:45:00,10-6-19 13:45:00,john@adams.xyz,,,long tom,2019-10-06T16:45:00\n' +
  'Hallo,Welt,"When tyranny becomes law, rebellion becomes duty.",Thomas Jefferson,"Friday Oct 4, 2019","Oct 6 2019 1:45:00 PM",ben@franklin.xyz,,,long tom,\n';


//FLNR 8 - 4th Ave is some data that was interpreted as date...
const badData = 'Start Date,End Date TS,To,Cc,Bcc,Tag,Delay TS\n' +
  'FLNR 8 - 4th Ave,10/6/2019 1:45 PM,"hamlet@dane.xyz, king@lear.xyz",julius@caesar.xyz,,the bard,FLNR 8 - 4th Ave\n';

const toFile = data => new Blob([data], {
  type: 'text/plain'
});

const fileParse = data => {
  return new Promise((resolve, reject) => {
    ExcelUtils.parseFile(toFile(data), (d) => {
      try {
        resolve(d);
      } catch (e) {
        reject(e);
      }
    });
  });
};

describe('ExcelUtils validateContext test', () => {
  it('validates when context has to and is an array with a value', () => {
    expect(ExcelUtils.validateContext({to: ['me@you.com']})).toBeTruthy();
  });
  it('fails when no to provided', () => {
    expect(ExcelUtils.validateContext({not: ['me@you.com']})).toBeFalsy();
  });
  it('fails when to has no items', () => {
    expect(ExcelUtils.validateContext({to: []})).toBeFalsy();
  });
  it('fails when to is not array', () => {
    expect(ExcelUtils.validateContext({to: 'me@you.com'})).toBeFalsy();
  });
});

describe('ExcelUtils parseFile test', () => {
  it('validates when context has to and is an array with a value', async () => {
    const data = await fileParse(goodData);
    expect(data).toBeTruthy();
  });
  it('parses contexts correctly', async () => {
    const data = await fileParse(goodData);
    const contexts = JSON.parse(data.contexts);
    expect(contexts).toHaveLength(5);
  });
  it('parses delayTS correctly', async () => {
    const data = await fileParse(goodData);
    const contexts = JSON.parse(data.contexts);
    //delayTS[0] = Oct 4 2019 14:45
    const local = moment('Oct 4 2019 14:45', 'MMM D YYYY HH:mm');
    const utc = moment.utc(local);
    expect(contexts[0].delayTS).toEqual(utc.valueOf());
  });
  it('parses start date correctly', async () => {
    const data = await fileParse(goodData);
    const contexts = JSON.parse(data.contexts);
    //startDate[0] = 10/4/2019
    expect(contexts[0].context.startDate).toBe('2019-10-04');
    //startDate[1] = Oct 4 2019
    expect(contexts[1].context.startDate).toBe('2019-10-04');
    //startDate[2] = 4 Oct 2019
    expect(contexts[2].context.startDate).toBe('2019-10-04');
    //startDate[3] = 10-4-19
    expect(contexts[3].context.startDate).toBe('2019-10-04');
    //startDate[4] = Friday Oct 4, 2019
    expect(contexts[4].context.startDate).toBe('2019-10-04');
  });
  it('parses end date correctly', async () => {
    const data = await fileParse(goodData);
    const contexts = JSON.parse(data.contexts);
    //endDateTS[0] = 10/6/2019 1:45 PM
    expect(contexts[0].context.endDateTs).toBe('2019-10-06 13:45');
    //endDateTS[1] = Oct 6 2019 13:45
    expect(contexts[1].context.endDateTs).toBe('2019-10-06 13:45');
    //endDateTS[2] = 6 Oct 2019 13:45
    expect(contexts[2].context.endDateTs).toBe('2019-10-06 13:45');
    //endDateTS[3] = 10-6-19 13:45:00
    expect(contexts[3].context.endDateTs).toBe('2019-10-06 13:45');
    //endDateTS[4] = Oct 6 2019 1:45:00 PM
    expect(contexts[4].context.endDateTs).toBe('2019-10-06 13:45');
  });
  it('handles bad date datacorrectly', async () => {
    const data = await fileParse(badData);
    const contexts = JSON.parse(data.contexts);
    // start date throws false positives in moment, but should then be handled gracefully and original value returned.
    expect(contexts[0].context.startDate).toBe('FLNR 8 - 4th Ave');
    // delay ts is not a timestamp, so should not exist
    expect(contexts[0].context.delayTS).toBeUndefined();
  });
});
