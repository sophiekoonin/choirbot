import {
  testAttendancePost,
  testTeamId,
  testTimestamp,
  testUser3,
  testUser4,
  testUserId
} from '../test/testData'
import {
  getAttendancePostBlocks,
  getAttendancePosts,
  getReactionsForPost
} from './helpers'
import { db } from '../db/db'
import { mockLimit } from 'firestore-jest-mock/mocks/firestore'
import { SlackClient } from '../slack/client'
jest.mock('../db/db')
jest.mock('../slack/client')

const testTimestamp2 = '13535234.5353567'
const testTimestamp3 = '13533443.5353568'
const testAttendancePost1 = testAttendancePost
const testAttendancePost2: typeof testAttendancePost = {
  id: testTimestamp2,
  attending: [],
  not_attending: [],
  created_at: 165470924,
  rehearsal_date: '06/05/2024',
  ts: testTimestamp2
}
const testAttendancePost3: typeof testAttendancePost = {
  id: testTimestamp3,
  attending: [],
  not_attending: [],
  created_at: 165470924,
  rehearsal_date: '19/05/2024',
  ts: testTimestamp3
}

describe('attendance helpers', () => {
  describe('getAttendancePosts', () => {
    // @ts-expect-error mock
    db.setMockDbContents({
      attendance: [
        testAttendancePost1,
        testAttendancePost2,
        testAttendancePost3
      ]
    })

    // Not asserting on the actual order_by here because
    // that's mocked out, and it's firebase's implementation anyway
    test('get all attendance posts', async () => {
      const posts = await getAttendancePosts(testTeamId)
      expect(mockLimit).not.toHaveBeenCalled()
      expect(posts.length).toBe(3)
    })

    test('get latest attendance post', async () => {
      await getAttendancePosts(testTeamId, 1)
      expect(mockLimit).toHaveBeenCalledWith(1)
    })
  })

  test('getAttendancePostBlocks', () => {
    const blocks = getAttendancePostBlocks({
      songs: {
        mainSong: 'Main Song',
        runThrough: 'Run Through',
        mainSongLink: 'main-song-link',
        runThroughLink: 'run-through-link',
        notes: 'Blah blah blah',
        customColumnHeader: '',
        customColumnValue: ''
      },
      blocks: ['main_song', 'run_through', 'notes'],
      introText: 'Hello world'
    })
    expect(blocks).toEqual([
      {
        type: 'section',
        block_id: 'introduction',
        text: {
          type: 'mrkdwn',
          text: 'Hello world'
        }
      },
      {
        type: 'section',
        block_id: 'main_song',
        text: {
          type: 'mrkdwn',
          text: "*We're singing*: <main-song-link|Main Song>"
        }
      },
      {
        type: 'section',
        block_id: 'run_through',
        text: {
          type: 'mrkdwn',
          text: '*Run through*: <run-through-link|Run Through>'
        }
      },
      {
        type: 'section',
        block_id: 'notes',
        text: {
          type: 'mrkdwn',
          text: ':information_source: Blah blah blah'
        }
      }
    ])
  })

  test('getReactionsForPost gets reactions for a post', async () => {
    const reactions = [
      {
        users: [testUserId],
        name: 'raised_hands'
      },
      {
        users: [testUser3, testUser4],
        name: '-1'
      }
    ]
    // @ts-expect-error mock
    SlackClient.reactions.get.mockResolvedValue({
      channel: 'test-channel',
      ok: true,
      message: {
        reactions
      }
    })

    const result = await getReactionsForPost(
      'test-token',
      'test-channel',
      testTimestamp
    )
    expect(result).toEqual(reactions)
  })
})
