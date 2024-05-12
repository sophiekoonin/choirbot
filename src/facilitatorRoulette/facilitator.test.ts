import { SlackClient } from '../slack/client'
import { testTeamId, testUser3, testUser4, testUserId } from '../test/testData'
jest.mock('../slack/client')
jest.mock('../db/db')

describe('facilitator roulette', () => {
  test(`Persists the user ID of the person who volunteered and doesn't post`, async () => {})
  test(`Chooses one of the people attending to facilitate`, async () => {})
  test(`Doesn't choose the same person to facilitate within a 4 week period`, async () => {})
})
