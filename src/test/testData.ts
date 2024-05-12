export const testUserId = 'U01A1B2C3'
export const testChannelId = 'C01A1B2C3'
export const testTeamId = 'T01A1B2C3'
export const testBotId = 'B01A1B2C3'
export const testTeamData = {
  id: testTeamId,
  channel_id: testChannelId,
  user_id: testUserId,
  rehearsal_day: 1,
  token: 'test-token',
  attendance_blocks: ['main_song', 'run_through'],
  bot_user_id: testBotId,
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
export const testRehearsalDate = new Date('2024-05-06') // this is a Monday
export const testRehearsalDateString = '06/05/2024'
export const testTimestamp = '1654709611.420969'
export const testTimestamp2 = '13535234.5353567'
export const testTimestamp3 = '13533443.5353568'
export const testTimestamp4 = '135333535.5353569'

export const testAttendancePost = {
  id: testRehearsalDateString,
  attending: [testUserId, testUser2, testUser3],
  not_attending: [testUser4],
  created_at: 1654709612,
  rehearsal_date: testRehearsalDateString,
  ts: testTimestamp
}

export const testSpreadsheetHeaders = [
  'Main song',
  'Run through',
  'Notes',
  'Main song link',
  'Run through link',
  'Custom Column Header'
]
export const testSpreadsheetData = [
  {
    range: 'B1:I1',
    values: [testSpreadsheetHeaders]
  },
  {
    range: 'B4:I4',
    values: [
      'Main Song Title',
      'Run Through Title',
      'Blah blah blah',
      'main-song-link',
      'run-through-link',
      'Custom column value'
    ]
  }
]

export const spreadsheetDateRows = [
  'Date',
  '21/04/2024',
  '28/04/2024',
  testRehearsalDateString,
  '12/05/2024',
  '19/05/2024'
]

export function recordWithoutId(
  obj: typeof testAttendancePost | typeof testTeamData
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...rest } = obj
  return rest
}

export const testAttendancePost2: typeof testAttendancePost = {
  id: '06/05/2024',
  attending: [],
  not_attending: [],
  created_at: 165470924,
  rehearsal_date: '06/05/2024',
  ts: testTimestamp2
}
export const testAttendancePost3: typeof testAttendancePost = {
  id: '19/05/2024',
  attending: [],
  not_attending: [],
  created_at: 165470924,
  rehearsal_date: '19/05/2024',
  ts: testTimestamp3
}

export const testAttendancePost4: typeof testAttendancePost = {
  id: '26/05/2024',
  attending: [],
  not_attending: [],
  created_at: 165470924,
  rehearsal_date: '26/05/2024',
  ts: testTimestamp4
}
