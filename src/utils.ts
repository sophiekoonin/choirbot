import moment from 'moment'
import * as db from './db'
import {
  BankHolidayCache,
  BankHolidaysResponse,
  BankHolidayEvent
} from './DataCache'

const { NODE_ENV } = process.env
const config = NODE_ENV === 'dev' ? require('../config.json') : {}
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

export async function getDbOrConfigValue(
  collection: string,
  docName: string,
  key: string
): Promise<string> {
  if (NODE_ENV !== 'prod') {
    return config[docName][key]
  } else {
    return await db.getValue(collection, docName, key)
  }
}

export async function getDbOrConfigValues(
  collection: string,
  docName: string,
  keys: Array<string>
): Promise<Array<string>> {
  if (NODE_ENV !== 'prod') {
    return keys.map(key => config[docName][key])
  } else {
    return await db.getValues(collection, docName, keys)
  }
}
