import { testAttendancePost, testTeamId } from '../test/testData'
import { getAttendancePosts } from './helpers'
import { db } from '../db/db'
import { mockLimit } from 'firestore-jest-mock/mocks/firestore'
jest.mock('../db/db')

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
})
