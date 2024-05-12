import nock from 'nock'
import { isBankHoliday } from './utils'
nock('https://www.gov.uk')
  .get('/bank-holidays.json')
  .reply(200, {
    'england-and-wales': {
      events: [
        {
          title: 'New Year’s Day',
          date: '2024-01-01',
          notes: '',
          bunting: true
        }
      ]
    }
  })

describe('general utils', () => {
  test('isBankHoliday', async () => {
    expect(await isBankHoliday('2024-01-01')).toBe(true)
    expect(await isBankHoliday('2024-01-02')).toBe(false)
  })
})
