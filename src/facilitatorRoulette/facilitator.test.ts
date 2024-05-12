import { SlackClient } from '../slack/client'
import { testTeamId, testUser3, testUser4, testUserId } from '../test/testData'
import { getVolunteerFacilitator } from './facilitator'
jest.mock('../slack/client')
jest.mock('../db/db')

describe('facilitator magic 8 ball', () => {
  test(`Persists the user ID of the person who volunteered and doesn't post`, async () => {})
  test(`Chooses one of the people attending to facilitate`, async () => {})
  test(`Doesn't choose the same person to facilitate within a 4 week period`, async () => {})
})

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

describe('hasVolunteeredRecently', () => {
  test('Returns true if the user has facilitated in the past 4 weeks', async () => {})
  test('Returns false if the user has not facilitated in the past 4 weeks', async () => {})
})
