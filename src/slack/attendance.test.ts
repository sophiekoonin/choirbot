import {
  testAttendancePost,
  testChannelId,
  testTeamData
} from '../test/testData'
import { mockGoogleCloudFirestore } from 'firestore-jest-mock'
import { postAttendanceMessage } from './attendance'
import { SlackClient } from './client'
jest.mock('./client')
jest.mock('../db')
describe('Attendance post', () => {
  const token = testTeamData.token
  const channel = testChannelId
  const teamId = testTeamData.id
  mockGoogleCloudFirestore({
    database: {
      teams: [testTeamData],
      'attendance-C12345': [testAttendancePost]
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })
  test("Couldn't find songs", async () => {
    await postAttendanceMessage({
      channel,
      token,
      teamId,
      date: new Date(),
      blocks: [],
      introText: testTeamData.intro_text
    })
    expect(SlackClient.chat.postMessage).toHaveBeenCalledWith({
      token,
      channel,
      text: expect.stringContaining(
        "Tried to post attendance message, but couldn't find a row for"
      )
    })
  })
})
