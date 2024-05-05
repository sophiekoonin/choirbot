// Mock googleapis sheets_v4.

import { spreadsheetDateRows, testSpreadsheetData } from '../test/testData'

export const google = {
  auth: {
    getClient: jest.fn()
  },
  sheets: jest.fn(() => ({
    spreadsheets: {
      values: {
        get: jest.fn(async () => {
          return {
            data: {
              values: [spreadsheetDateRows]
            }
          }
        }),
        batchGet: jest.fn(async () => {
          return {
            data: {
              valueRanges: testSpreadsheetData
            }
          }
        })
      }
    }
  }))
}
