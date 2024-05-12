import { mockUpdate } from 'firestore-jest-mock/mocks/firestore'
import { SlackClient } from '../slack/client'
import {
  testAttendancePost,
  testAttendancePost2,
  testAttendancePost3,
  testAttendancePost4,
  testBotId,
  testTeamId,
  testUser2,
  testUser3,
  testUser4,
  testUserId
} from '../test/testData'
import { mockRandomForEach } from 'jest-mock-random'
import { runFacilitatorRoulette } from './facilitator'
import { db } from '../db/db'
jest.mock('../slack/client')
jest.mock('../db/db')

describe('facilitator roulette', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  mockRandomForEach([0.1, 0.2, 0.3, 0.6])

  test(`Persists the user ID of the person who volunteered and doesn't post`, async () => {
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

    await runFacilitatorRoulette(
      testTeamId,
      'test-token',
      'test-channel',
      'test-bot-id'
    )
    expect(mockUpdate).toHaveBeenCalledWith({
      roles: { facilitator: testUserId }
    })
    expect(SlackClient.chat.postMessage).not.toHaveBeenCalled()
  })

  test(`Chooses one of the people attending to facilitate if nobody volunteered`, async () => {
    // @ts-expect-error mock
    SlackClient.reactions.get.mockResolvedValue({
      channel: 'test-channel',
      ok: true,
      message: {
        reactions: [
          {
            users: [testUser2, testUser3, testBotId],
            name: '+1'
          },
          {
            users: [testUserId, testUser4],
            name: '-1'
          }
        ]
      }
    })

    await runFacilitatorRoulette(
      testTeamId,
      'test-token',
      'test-channel',
      testBotId
    )
    expect(mockUpdate).toHaveBeenCalledWith({
      roles: { facilitator: testUser2 }
    })
    expect(SlackClient.chat.postMessage).toHaveBeenCalledWith({
      channel: 'test-channel',
      reply_broadcast: true,
      text: `:8ball: Today's randomly-chosen faciliator is <@${testUser2}>!`,
      thread_ts: '1654709611.420969',
      token: 'test-token'
    })
  })
  test(`Doesn't choose the same person to facilitate within a 4 week period`, async () => {
    // @ts-expect-error mock
    db.setMockDbContents({
      attendance: [
        { ...testAttendancePost, roles: { facilitator: testUserId } },
        { ...testAttendancePost2, roles: { facilitator: testUser3 } },
        { ...testAttendancePost3, roles: { facilitator: testUser4 } },
        { ...testAttendancePost4, roles: { facilitator: testUser2 } }
      ]
    })

    // @ts-expect-error mock
    SlackClient.reactions.get.mockResolvedValue({
      channel: 'test-channel',
      ok: true,
      message: {
        reactions: [
          {
            users: [testUserId, testUser3, testUser4],
            name: '+1'
          }
        ]
      }
    })

    await runFacilitatorRoulette(
      testTeamId,
      'test-token',
      'test-channel',
      testBotId
    )
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(SlackClient.chat.postMessage).toHaveBeenCalledWith({
      channel: 'test-channel',
      reply_broadcast: true,
      text: `:raised_hands::warning: I tried to pick a facilitator for today's rehearsal but I wasn't able to. Please can someone volunteer?`,
      thread_ts: '1654709611.420969',
      token: 'test-token'
    })
  })
})
