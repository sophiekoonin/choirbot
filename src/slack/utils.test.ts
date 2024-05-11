import { db } from '../db'
import {
  testBotId,
  testTeamId,
  testUser2,
  testUser3,
  testUser4,
  testUserId
} from '../test/testData'
import { SlackClient } from './client'
import { getSlackUserIds, getUserReactionsForEmoji } from './utils'

jest.mock('../db/db')
jest.mock('./client')
describe('slack utils', () => {
  test('getSlackUserIds returns only active members who are human and not ignored', async () => {
    // @ts-expect-error mock
    db.setMockDbContents({
      teamOverrides: {
        ignored_users: ['U02']
      }
    })

    // @ts-expect-error mock
    SlackClient.users.list.mockResolvedValue({
      members: [
        { id: 'U01', name: 'user1' },
        { id: 'U02', name: 'user2' },
        { id: 'U03', name: 'user3', deleted: true },
        { id: 'U04', name: 'user4' },
        { id: 'U05', name: 'user5' },
        { id: 'USLACKBOT', name: 'slackbot' },
        { id: 'U06', name: 'bot', is_bot: true }
      ]
    })

    const result = await getSlackUserIds(testTeamId, 'test-token')
    expect(result).toEqual(['U01', 'U04', 'U05'])
  })

  test('getUserReactionsForEmoji pulls the user IDs from the correct reaction group', () => {
    const reactions = [
      { name: 'partyparrot', users: [testUserId], count: 1 },
      { name: '+1', users: [testUser2, testUser3, testBotId], count: 3 },
      { name: 'mildpanic', users: [testUser2, testUser4], count: 2 }
    ]
    expect(
      getUserReactionsForEmoji({ reactions, emoji: '+1', botId: testBotId })
    ).toEqual([testUser2, testUser3])
  })
})
