import { mockRandomForEach } from 'jest-mock-random'
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
  hasUserFacilitatedInLastFourWeeks,
  pickRandomAttendee
} from './helpers'
import { db } from '../db/db'
jest.mock('../slack/client')
jest.mock('../db/db')

describe('facilitator roulette helpers', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  describe('pickRandomAttendee', () => {
    mockRandomForEach([0.1, 0.1, 0.1, 0.1]) // Check the loop takes into account the filtered out user IDs

    // @ts-expect-error mock
    db.setMockDbContents({
      attendance: [
        { ...testAttendancePost, roles: { facilitator: testUserId } },
        { ...testAttendancePost2, roles: { facilitator: testUser3 } },
        { ...testAttendancePost3, roles: { facilitator: testUser4 } },
        { ...testAttendancePost4, roles: { facilitator: testUser2 } },
        { ...testAttendancePost4, roles: { facilitator: 'blah' } }
      ]
    })
    test(`Returns a random-ish user who hasn't faciliated recently`, async () => {
      const testAttendees = [testUserId, testUser2, 'User2', 'User3', 'User4']
      const result = await pickRandomAttendee(
        testAttendees,
        testTeamId,
        null,
        null
      )
      expect(result).toEqual('User2')
    })

    test(`Returns a random-ish user who hasn't volunteered for a warmup`, async () => {
      const testAttendees = [testUserId, testUser2, 'UserPickMe']
      const result = await pickRandomAttendee(
        testAttendees,
        testTeamId,
        testUserId,
        testUser2
      )
      expect(result).toEqual('UserPickMe')
    })

    test(`Returns null if all attendees have facilitated recently`, async () => {
      const testAttendees = [testUserId, testUser2, testUser3, testUser4]
      const result = await pickRandomAttendee(
        testAttendees,
        testTeamId,
        null,
        null
      )
      expect(result).toBe(null)
    })
  })
  describe('hasUserFacilitatedInLastFourWeeks', () => {
    test('Returns true if the user has facilitated in the past 4 weeks', async () => {
      // @ts-expect-error mock
      db.setMockDbContents({
        attendance: [
          { ...testAttendancePost, roles: { facilitator: testUserId } },
          { ...testAttendancePost2, roles: { facilitator: testUser3 } },
          { ...testAttendancePost3, roles: { facilitator: testUser4 } },
          { ...testAttendancePost4, roles: { facilitator: testUser2 } },
          { ...testAttendancePost4, roles: { facilitator: 'blah' } }
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
          { ...testAttendancePost4, roles: { facilitator: testUser2 } },
          { ...testAttendancePost4, roles: { facilitator: 'blah' } }
        ]
      })

      const result = await hasUserFacilitatedInLastFourWeeks(
        testTeamId,
        testUserId
      )
      expect(result).toBe(false)
    })
    test(`Ignores attendance posts that don't have roles or if there aren't 5 posts`, async () => {
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
