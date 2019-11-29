import { google, sheets_v4 } from 'googleapis'
import * as db from '../db'
import { SongData, GoogleAuth } from './types'
import { TeamId } from '../slack/types'
import { Request, Response } from 'express'

const sheets: sheets_v4.Sheets = google.sheets('v4')

async function getRowNumberForDate(
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
    const values = [].concat.apply([], response.data.values)
    const rowNumber = values.indexOf(dateString) + 1
    return rowNumber > 0 ? rowNumber : 1
  } catch (err) {
    console.error(`Error getting row number: ${err}`)
    throw new Error(err)
  }
}

async function getSongDetailsFromSheet(
  auth: GoogleAuth,
  sheetId: string,
  rowNumber: string
): Promise<SongData> {
  try {
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: sheetId,
      range: `B${rowNumber}:I${rowNumber}`
    })
    const values = [].concat.apply([], response.data.values)
    const mainSong = values[0]
    const runThrough = values[1]
    const notes = values[2]
    const mainSongLink = values[6]
    const runThroughLink =
      values[1] === '' || values[1] === null
        ? `https://docs.google.com/spreadsheets/d/${sheetId}`
        : values[7]
    return {
      mainSong,
      mainSongLink,
      runThrough,
      runThroughLink,
      notes
    }
  } catch (err) {
    console.error(
      `The API returned an error when trying to get song details: ${err}`
    )
    throw new Error(err)
  }
}

export async function getNextSongs(dateString: string, teamId: TeamId) {
  const credentials = await getGoogleCreds()
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    credentials
  })
  const sheetId = await db.getValue('teams', teamId, 'google_sheet_id')
  const rowNumber = await getRowNumberForDate(auth, sheetId, dateString)
  return await getSongDetailsFromSheet(auth, sheetId, rowNumber)
}

export async function putGoogleCredentials(req: Request, res: Response) {
  const { credentials } = req.body
  try {
    await db.updateDbValue('tokens', 'google', credentials)
    res.status(201).send('Successfully set!')
  } catch (err) {
    console.error(err)
    res.status(500).send(`Error setting google credentials: ${err}`)
  }
}

export async function testGoogleIntegration(req: Request, res: Response) {
  try {
    const sheetId = await db.getValue('config', 'google', 'sheet_id')
    const credentials = await getGoogleCreds()
    const auth = await google.auth.getClient({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      credentials
    })
    const testDate = '04/02/2019'
    const rowNumber = await getRowNumberForDate(auth, sheetId, testDate)
    res.status(200).send(`Row number is ${rowNumber}`)
  } catch (err) {
    console.error(err)
    res.status(500).send(err)
  }
}

async function getGoogleCreds() {
  const credentials = await db.getDocData('tokens', 'google')
  const privateKey = await db.getValue('tokens', 'google', 'private_key')
  return {
    ...credentials,
    private_key: privateKey.replace(/\\n/g, '\n')
  }
}
