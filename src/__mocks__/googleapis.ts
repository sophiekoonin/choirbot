// Mock googleapis sheets v4.

import { GoogleApis } from 'googleapis'
import { spreadsheetDateRows, testSpreadsheetData } from '../test/testData'

const googleapis = jest.createMockFromModule('googleapis') as GoogleApis

let mockBatchGetReturnValue = testSpreadsheetData
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
              valueRanges: mockBatchGetReturnValue
            }
          }
        })
      }
    }
  })),
  setMockBatchGetReturnValue: (value: typeof mockBatchGetReturnValue) => {
    mockBatchGetReturnValue = value
  }
}

googleapis.google = google
export default googleapis
