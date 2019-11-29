import moment from 'moment'
import { BankHolidayCache, BankHolidayEvent } from './DataCache'

const BankHolCache = new BankHolidayCache(43830) // 1 month
export function getNextMonday(): string {
  const today = moment().day()
  const monday = today > 1 ? 8 : 1 //set day of week according to whether today is before sunday or not - see Moment.js docs
  return moment()
    .day(monday)
    .format('DD/MM/YYYY')
}

export async function isBankHoliday(date: string): Promise<boolean> {
  let allBankHols = await BankHolCache.getData()
  const { events }: { events: Array<BankHolidayEvent> } = allBankHols[
    'england-and-wales'
  ]
  const allDates = events.map(evt => evt.date)
  return allDates.includes(date)
}
