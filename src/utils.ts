import moment from 'moment'
import fetch from 'node-fetch'
import memcache from 'memory-cache'
import * as db from './db'

const { NODE_ENV } = process.env
const config = NODE_ENV === 'dev' ? require('../config.json') : {}

export function getNextMonday(): string {
  const today = moment().day()
  const monday = today > 1 ? 8 : 1 //set day of week according to whether today is before sunday or not - see Moment.js docs
  return moment()
    .day(monday)
    .format('DD/MM/YYYY')
}

export async function isBankHoliday(date: string): Promise<boolean> {
  let allBankHols
  allBankHols = memcache.get('bank-holidays')
  if (!allBankHols) {
    const response = await fetch('https://www.gov.uk/bank-holidays.json')
    allBankHols = await response.json()
    memcache.put('bank-holidays', allBankHols)
  }
  const { events } = allBankHols['england-and-wales']
  const allDates = events.map(evt => evt.date)
  return allDates.includes(date)
}

export async function getDbOrConfigValue(collection: string, docName: string, key: string): Promise<string> {
  if (NODE_ENV !== 'prod') {
    return config[docName][key]
  } else {
    return await db.getValue(collection, docName, key)
  }
}

export async function getDbOrConfigValues(collection: string, docName: string, keys: Array<string>): Promise<Array<string>> {
  if (NODE_ENV !== 'prod') {
    return keys.map(key => config[docName][key])
  } else {
    return await db.getValues(collection, docName, keys)
  }
}

export const dayNumberToString = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
}
