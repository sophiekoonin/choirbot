import { mockUpdate } from 'firestore-jest-mock/mocks/firestore'
import { testTeamId, testUser2, testUserId } from '../../test/testData'
import { handleInteractions } from './handler'

jest.mock('../../db/db')
jest.mock('../client')

describe('Slack interactions handler', () => {
  const response = {
    send: jest.fn()
  }
  beforeEach(() => {
    jest.clearAllMocks()
  })
  test('Handles view submission', async () => {
    const req = {
      body: {
        payload: JSON.stringify({
          type: 'view_submission',
          team: { id: testTeamId, domain: 'test' },
          user: {
            id: testUserId,
            username: 'sophie',
            name: 'sophie',
            team_id: testTeamId
          },
          api_app_id: 'AR2BFBJMV',
          token: 'test-token',
          trigger_id:
            '7096264320454.93927944293.7acb673a7c39ed7279b4e7fdc91fe2e1',
          view: {
            state: {
              values: {
                ignored_users: {
                  ignored_users: {
                    type: 'multi_users_select',
                    selected_users: [testUser2]
                  }
                }
              }
            }
          }
        })
      }
    }
    // @ts-expect-error partial
    await handleInteractions(req, response)
    expect(mockUpdate).toHaveBeenCalledWith({
      ignored_users: [testUser2]
    })
  })
})
