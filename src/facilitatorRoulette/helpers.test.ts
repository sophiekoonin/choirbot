import { SlackClient } from '../slack/client'
import {
  testAttendancePost,
  testAttendancePost2,
  testAttendancePost3,
  testAttendancePost4,
  testTeamId,
  testUser2,
  testUser3,
  testUser4,
  testUserId
} from '../test/testData'
import {
  getVolunteerFacilitator,
  hasUserFacilitatedInLastFourWeeks
} from './helpers'
import { db } from '../db/db'
jest.mock('../slack/client')
jest.mock('../db/db')

describe('facilitator roulette helpers', () => {
  describe('getVolunteerFacilitator', () => {
    test('Returns the user ID of the person who volunteered', async () => {
      // @ts-expect-error mock
      SlackClient.reactions.get.mockResolvedValue({
        channel: 'test-channel',
        ok: true,
        message: {
          reactions: [
            {
              users: [testUserId],
              name: 'raised_hands'
            },
            {
              users: [testUser3, testUser4],
              name: '-1'
            }
          ]
        }
      })

      const result = await getVolunteerFacilitator(
        testTeamId,
        'test-token',
        'test-channel'
      )
      expect(result).toEqual(testUserId)
    })

    test('Returns null if no one volunteered', async () => {
      // @ts-expect-error mock
      SlackClient.reactions.get.mockResolvedValue({
        channel: 'test-channel',
        ok: true,
        message: {
          reactions: [
            {
              users: [testUser3, testUser4],
              name: '-1'
            }
          ]
        }
      })

      const result = await getVolunteerFacilitator(
        testTeamId,
        'test-token',
        'test-channel'
      )
      expect(result).toBeNull()
    })
  })

  describe('hasUserFacilitatedInLastFourWeeks', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    test.skip('Returns true if the user has facilitated in the past 4 weeks', async () => {
      // @ts-expect-error mock
      db.setMockDbContents({
        attendance: [
          { ...testAttendancePost, roles: { facilitator: testUserId } },
          { ...testAttendancePost2, roles: { facilitator: testUser3 } },
          { ...testAttendancePost3, roles: { facilitator: testUser4 } },
          { ...testAttendancePost4, roles: { facilitator: testUser2 } }
        ]
      })

      const result = await hasUserFacilitatedInLastFourWeeks(
        testTeamId,
        testUserId
      )
      expect(result).toBe(true)
    })

    test('Returns false if the user has not facilitated in the past 4 weeks', async () => {
      // @ts-expect-error mock
      db.setMockDbContents({
        attendance: [
          { ...testAttendancePost, roles: { facilitator: 'someOtherUser' } },
          { ...testAttendancePost2, roles: { facilitator: testUser3 } },
          { ...testAttendancePost3, roles: { facilitator: testUser4 } },
          { ...testAttendancePost4, roles: { facilitator: testUser2 } }
        ]
      })

      const result = await hasUserFacilitatedInLastFourWeeks(
        testTeamId,
        testUserId
      )
      expect(result).toBe(false)
    })
    test(`Ignores attendance posts that don't have roles`, async () => {
      // @ts-expect-error mock
      db.setMockDbContents({
        attendance: [
          { ...testAttendancePost, roles: { facilitator: testUserId } },
          { ...testAttendancePost2, roles: { facilitator: testUser3 } },
          { ...testAttendancePost3 },
          { ...testAttendancePost4 }
        ]
      })

      const result1 = await hasUserFacilitatedInLastFourWeeks(
        testTeamId,
        testUserId
      )
      expect(result1).toBe(true)

      const result2 = await hasUserFacilitatedInLastFourWeeks(
        testTeamId,
        testUser2
      )
      expect(result2).toBe(false)
    })
  })
})
