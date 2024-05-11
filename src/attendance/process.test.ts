import { mockUpdate } from 'firestore-jest-mock/mocks/firestore'
import {
  testTeamId,
  testUser2,
  testUser3,
  testUser4,
  testUserId
} from '../test/testData'
import { processAttendanceForTeam } from './process'
import { SlackClient } from '../slack/client'

jest.mock('../db/db')
jest.mock('../slack/client')
describe('Processing attendance responses', () => {
  test('updates the database with the emoji reactions on the post', async () => {
    // @ts-expect-error mock
    SlackClient.reactions.get.mockResolvedValue({
      channel: 'test-channel',
      ok: true,
      message: {
        reactions: [
          {
            users: [testUserId, testUser2],
            name: '+1'
          },
          {
            users: [testUser3, testUser4],
            name: '-1'
          }
        ]
      }
    })

    await processAttendanceForTeam({
      teamId: testTeamId,
      token: 'test-token',
      channel: 'test-channel'
    })

    expect(mockUpdate).toHaveBeenCalledWith({
      attending: [testUserId, testUser2],
      notAttending: [testUser3, testUser4]
    })
  })
})
