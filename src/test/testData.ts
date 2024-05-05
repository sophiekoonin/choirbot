export const testUserId = 'U01A1B2C3'
export const testChannelId = 'C01A1B2C3'

export const testTeamData = {
  id: testChannelId,
  channel_id: testChannelId,
  user_id: testUserId,
  rehearsal_day: 1,
  token: 'test-token',
  bot_user_id: 'B0T123',
  channel: 'rehearsals',
  google_sheet_id: 'somesheetid',
  intro_text: 'Hello world',
  team_name: 'test',
  rehearsal_reminders: true,
  active: true
}

export const testUser2 = 'U01A1B2C4'
export const testUser3 = 'U01A1B2C5'
export const testUser4 = 'U01A1B2C6'
export const testRehearsalDate = '05/05/2024'
export const testTimestamp = '1654709611.420969'
export const testAttendancePost = {
  id: testTimestamp,
  attending: [testUserId, testUser2, testUser3],
  not_attending: [testUser4],
  created_at: 1654709612,
  rehearsal_date: testRehearsalDate,
  roles: {
    volunteer_facilitator: testUser2,
    volunteer_musical_warmup: testUserId,
    volunteer_physical_warmup: testUser3
  },
  ts: testTimestamp
}

export const testSpreadsheetHeaders = [
  'Main song',
  'Run through',
  'Notes',
  'Main song link',
  'Run through link'
]
export const testSpreadsheetData = [
  {
    range: 'B1:I1',
    values: [testSpreadsheetHeaders]
  },
  {
    range: 'B4:I4',
    values: [
      'Poison',
      'Dancing in the Dark',
      'Blah blah blah',
      'main-song-link',
      'run-through-link'
    ]
  }
]

export const spreadsheetDateRows = [
  'Date',
  '21/04/2024',
  '28/04/2024',
  testRehearsalDate,
  '12/05/2024',
  '19/05/2024'
]
