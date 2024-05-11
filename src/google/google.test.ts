import { testRehearsalDateString, testTeamId } from '../test/testData'
import {
  getNextSongs,
  getRowNumberForDate,
  getSongDetailsFromSheet
} from './google'
jest.mock('googleapis')
jest.mock('../db/db')

describe('google sheets integration', () => {
  test('getRowNumberForDate finds the correct 1-indexed row number for the given date, -1 if not found', async () => {
    expect(await getRowNumberForDate(null, 'sheetId', '21/04/2024')).toBe(2)
    expect(
      await getRowNumberForDate(null, 'sheetId', testRehearsalDateString)
    ).toBe(4)
    expect(await getRowNumberForDate(null, 'sheetId', 'cheese')).toBe(-1)
  })

  test('getSongDetailsFromSheet pulls through the correct details from the spreadsheet data', async () => {
    expect(await getSongDetailsFromSheet(null, 'sheetId', 2)).toEqual({
      customColumnHeader: 'Custom Column Header',
      customColumnValue: 'Custom column value',
      mainSong: 'Main Song Title',
      mainSongLink: 'main-song-link',
      notes: 'Blah blah blah',
      runThrough: 'Run Through Title',
      runThroughLink: 'run-through-link'
    })
  })

  test('getNextSongs returns the correct song data', async () => {
    expect(await getNextSongs(testRehearsalDateString, testTeamId)).toEqual({
      customColumnHeader: 'Custom Column Header',
      customColumnValue: 'Custom column value',
      mainSong: 'Main Song Title',
      mainSongLink: 'main-song-link',
      notes: 'Blah blah blah',
      runThrough: 'Run Through Title',
      runThroughLink: 'run-through-link'
    })
  })
})
