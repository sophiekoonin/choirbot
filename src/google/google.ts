import { google, sheets_v4 } from 'googleapis'
import { Request, Response } from 'express'

import * as dbHelpers from '../db/helpers'
import { SongData, GoogleAuth } from './types'
import { TeamId } from '../slack/types'
import { format } from 'date-fns'

const sheets: sheets_v4.Sheets = google.sheets('v4')

export async function getRowNumberForDate(
  auth: GoogleAuth,
  sheetId: string,
  dateString: string
) {
  const request: sheets_v4.Params$Resource$Spreadsheets$Values$Get = {
    auth,
    spreadsheetId: sheetId,
    range: 'A:A'
  }
  try {
    const response = await sheets.spreadsheets.values.get(request)
    const values = [...response.data.values].flat()
    const rowNumber = values.indexOf(dateString)
    // 1-indexed
    return rowNumber < 0 ? rowNumber : rowNumber + 1
  } catch (err) {
    console.error(`Error getting row number: ${err}`)
    throw new Error(err)
  }
}

/*
Schedule spreadsheet layout in columns:
B - Main song
C - Run through song
D - Notes
E - Main song link
F - Run through link
G - Free choice
*/

// TODO - grab the column header from G and pull through content.
export async function getSongDetailsFromSheet(
  auth: GoogleAuth,
  sheetId: string,
  rowNumber: number
): Promise<SongData> {
  try {
    const response = await sheets.spreadsheets.values.batchGet({
      auth,
      spreadsheetId: sheetId,
      ranges: ['B1:I1', `B${rowNumber}:I${rowNumber}`]
    })
    const { valueRanges } = response.data
    const headers = valueRanges.find((v) => v.range.match(/B1:I1/gi))
    const thisWeekData = valueRanges.find((v) => v.range !== headers.range)
    const customColumnHeader = headers.values.flat()[5]
    const [
      mainSong,
      runThrough,
      notes,
      mainSongLink,
      runThroughLink,
      customColumnValue
    ] = thisWeekData.values.flat()
    return {
      mainSong,
      mainSongLink,
      runThrough,
      runThroughLink,
      notes,
      customColumnHeader,
      customColumnValue
    }
  } catch (err) {
    console.error(
      `The API returned an error when trying to get song details: ${err}`
    )
    throw new Error(err)
  }
}

export async function getNextSongs(
  dateString: string,
  teamId: TeamId
): Promise<SongData | null> {
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS
  })
  const sheetId = await dbHelpers.getValue('teams', teamId, 'google_sheet_id')
  const rowNumber = await getRowNumberForDate(auth, sheetId, dateString)
  return rowNumber > 1
    ? await getSongDetailsFromSheet(auth, sheetId, rowNumber)
    : null
}

export async function putGoogleCredentials(req: Request, res: Response) {
  const { credentials } = req.body
  try {
    await dbHelpers.updateDbValue('tokens', 'google', credentials)
    res.status(201).send('Successfully set!')
  } catch (err) {
    console.error(err)
    res.status(500).send(`Error setting google credentials: ${err}`)
  }
}

export async function testGoogleIntegration(req: Request, res: Response) {
  try {
    const sheetId = process.env.TEST_SHEET_ID
    const auth = await google.auth.getClient({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS
    })
    const testDate = '18/03/2019'
    const rowNumber = await getRowNumberForDate(auth, sheetId, testDate)
    res.status(200).send(`Row number is ${rowNumber}`)
  } catch (err) {
    console.error(err)
    res.status(500).send(err)
  }
}

export async function isThereARehearsalToday(teamId: string) {
  const today = new Date()
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS
  })
  const row = await getRowNumberForDate(
    auth,
    teamId,
    format(today, 'dd/MM/yyyy')
  )
  if (row < 0) return false
  return true
}
