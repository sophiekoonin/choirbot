import { addDays, format } from 'date-fns'
import { BankHolidayCache, BankHolidayEvent } from './DataCache'

const BankHolCache = new BankHolidayCache(43830) // 1 month
export function getNextMonday(): string {
  const today = new Date().getDay()

  // Because America, Sunday is 0
  // so if today is 0, that means tomorrow is 1, which is Monday in computer land.
  // If today's day number is > 1, that means we are looking for Monday in _next week_, which
  // would be 8 if the numbers went up that high. (day no. 1 + 7 days)
  // So we need to find the difference between today's day number and 8, next Monday.
  const monday = today > 1 ? 8 : 1
  const differenceInDays = monday - today

  return format(addDays(new Date(), differenceInDays), 'dd/MM/yyyy')
}

export async function isBankHoliday(date: string): Promise<boolean> {
  const allBankHols = await BankHolCache.getData()
  const { events }: { events: Array<BankHolidayEvent> } =
    allBankHols['england-and-wales']
  const allDates = events.map((evt) => evt.date)
  return allDates.includes(date)
}
