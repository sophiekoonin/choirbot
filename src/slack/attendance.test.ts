import {
  testChannelId,
  testRehearsalDate,
  testTeamData,
  testUserId
} from '../test/testData'
import { postAttendanceMessage } from './attendance'
import { SlackClient } from './client'

// @ts-expect-error this is a mock
import { _setMockBatchGetReturnValue } from '../google/google'
import { text } from 'express'

jest.mock('./client')
jest.mock('../db')
describe('postAttendanceMessage', () => {
  const token = testTeamData.token
  const channel = testChannelId
  const teamId = testTeamData.id

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("Messages the person who installed if couldn't find a row in the spreadsheet", async () => {
    await postAttendanceMessage({
      channel,
      token,
      teamId,
      date: new Date('2021-01-01'),
      blocks: testTeamData.attendance_blocks,
      introText: testTeamData.intro_text
    })

    expect(SlackClient.chat.postMessage).toHaveBeenCalledWith({
      token,
      channel: testUserId,
      text: "Tried to post attendance message, but couldn't find a row for 01/01/2021 in the schedule. Please make sure the dates are correct!"
    })
  })

  test('Posts the correct thing with the appropriate blocks', async () => {
    await postAttendanceMessage({
      channel,
      token,
      teamId,
      date: testRehearsalDate,
      blocks: testTeamData.attendance_blocks,
      introText: testTeamData.intro_text
    })

    expect(SlackClient.chat.postMessage).toHaveBeenCalledWith({
      token,
      channel: testChannelId,
      text: "It's rehearsal day!",
      username: 'Attendance Bot',
      blocks: [
        {
          block_id: 'introduction',
          text: {
            text: 'Hello world',
            type: 'mrkdwn'
          },
          type: 'section'
        },
        {
          block_id: 'main_song',
          text: {
            text: "*We're singing*: <main-song-link|Main Song Title>",
            type: 'mrkdwn'
          },
          type: 'section'
        },
        {
          block_id: 'run_through',
          text: {
            text: '*Run through*: <run-through-link|Run Through Title>',
            type: 'mrkdwn'
          },
          type: 'section'
        }
      ]
    })
  })
})
