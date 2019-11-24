import fetch from 'node-fetch'

export interface BankHolidayEvent {
  title: string
  date: string
  notes: string
  bunting: boolean
}
export interface BankHolidaysResponse {
  [region: string]: {
    events: Array<BankHolidayEvent>
  }
}
export class BankHolidayCache {
  millisecondsToLive: number
  cache: BankHolidaysResponse | null
  fetchDate: Date

  constructor(minutesToLive = 10) {
    this.millisecondsToLive = minutesToLive * 60 * 1000
    this.cache = null
    this.getData = this.getData.bind(this)
    this.resetCache = this.resetCache.bind(this)
    this.isCacheExpired = this.isCacheExpired.bind(this)
    this.fetchDate = new Date(0)
  }

  isCacheExpired() {
    return (
      this.fetchDate.getTime() + this.millisecondsToLive < new Date().getTime()
    )
  }
  async getData(): Promise<BankHolidaysResponse> {
    if (!this.cache || this.isCacheExpired()) {
      console.log('cache expired - fetching new data')
      const response = await fetch('https://www.gov.uk/bank-holidays.json')
      const data = await response.json()
      this.cache = data
      this.fetchDate = new Date()
      return data
    } else {
      return Promise.resolve(this.cache)
    }
  }
  resetCache() {
    this.fetchDate = new Date(0)
  }
}
