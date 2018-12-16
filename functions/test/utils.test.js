const proxyquire = require('proxyquire');
const { expect } = require('chai');
const sinon = require('sinon');
const holidaysResponse = {
  'england-and-wales': {
    division: 'england-and-wales',
    events: [
      { title: 'Christmas Day', date: '2017-12-25', notes: '', bunting: true },
      { title: 'Boxing Day', date: '2017-12-26', notes: '', bunting: true },
      { title: 'New Year’s Day', date: '2018-01-01', notes: '', bunting: true },
      { title: 'Good Friday', date: '2018-03-30', notes: '', bunting: false },
      { title: 'Easter Monday', date: '2018-04-02', notes: '', bunting: true },
      {
        title: 'Early May bank holiday',
        date: '2018-05-07',
        notes: '',
        bunting: true
      },
      {
        title: 'Spring bank holiday',
        date: '2018-05-28',
        notes: '',
        bunting: true
      },
      {
        title: 'Summer bank holiday',
        date: '2018-08-27',
        notes: '',
        bunting: true
      },
      { title: 'Christmas Day', date: '2018-12-25', notes: '', bunting: true },
      { title: 'Boxing Day', date: '2018-12-26', notes: '', bunting: true },
      { title: 'New Year’s Day', date: '2019-01-01', notes: '', bunting: true },
      { title: 'Good Friday', date: '2019-04-19', notes: '', bunting: false },
      { title: 'Easter Monday', date: '2019-04-22', notes: '', bunting: true },
      {
        title: 'Early May bank holiday',
        date: '2019-05-06',
        notes: '',
        bunting: true
      },
      {
        title: 'Spring bank holiday',
        date: '2019-05-27',
        notes: '',
        bunting: true
      },
      {
        title: 'Summer bank holiday',
        date: '2019-08-26',
        notes: '',
        bunting: true
      },
      { title: 'Christmas Day', date: '2019-12-25', notes: '', bunting: true },
      { title: 'Boxing Day', date: '2019-12-26', notes: '', bunting: true },
      { title: 'New Year’s Day', date: '2020-01-01', notes: '', bunting: true },
      { title: 'Good Friday', date: '2020-04-10', notes: '', bunting: false },
      { title: 'Easter Monday', date: '2020-04-13', notes: '', bunting: true },
      {
        title: 'Early May bank holiday',
        date: '2020-05-04',
        notes: '',
        bunting: true
      },
      {
        title: 'Spring bank holiday',
        date: '2020-05-25',
        notes: '',
        bunting: true
      },
      {
        title: 'Summer bank holiday',
        date: '2020-08-31',
        notes: '',
        bunting: true
      },
      { title: 'Christmas Day', date: '2020-12-25', notes: '', bunting: true },
      {
        title: 'Boxing Day',
        date: '2020-12-28',
        notes: 'Substitute day',
        bunting: true
      }
    ]
  },
  somethingElseWeDontWant: {
    blah: 'blah'
  }
};
const utils = proxyquire('../utils', {
  'node-fetch': sinon.stub().returns(
    Promise.resolve({
      json: () => Promise.resolve(holidaysResponse)
    })
  )
});
describe('isBankHoliday', () => {
  it('should return true if the given date is a bank holiday', async () => {
    const date = '2018-12-25T00:00:00Z';
    const result = await utils.isBankHoliday(date);
    expect(result).to.equal(true);
  });

  it('should return false if the given date is not a bank holiday', async () => {
    const date = '2018-12-29T00:00:00Z';
    const result = await utils.isBankHoliday(date);
    expect(result).to.equal(false);
  });
});
