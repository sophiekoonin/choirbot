import { db } from '../../db'
import {
  testTeamId,
  testUser2,
  testUser3,
  testUser4,
  testUserId
} from '../../test/testData'
import { SlackClient } from '../client'
import { calculateAttendanceStats, getReportBlocks } from './reports'

jest.mock('../../db/db')
jest.mock('../client')
describe('Attendance reports', () => {
  describe('getReportBlocks', () => {
    test('calculates attendance stats and puts them into Slack blocks', async () => {
      // @ts-expect-error mock
      db.setMockDbContents({
        teamOverrides: {
          ignored_users: ['U05']
        },
        attendance: [
          {
            rehearsal_date: '20/05/2024',
            attending: [testUserId, testUser2, testUser4],
            notAttending: [testUser3]
          },
          {
            rehearsal_date: '13/05/2024',
            attending: [testUserId, testUser2, testUser4],
            notAttending: [testUser3]
          },
          {
            rehearsal_date: '06/05/2024',
            attending: [testUser2],
            notAttending: [testUserId, testUser3, testUser4]
          },
          {
            rehearsal_date: '29/04/2024',
            attending: [testUserId, testUser2],
            notAttending: [testUser3, testUser4]
          },
          {
            rehearsal_date: '22/04/2024',
            attending: [testUserId, testUser2, testUser3],
            notAttending: [testUser4]
          },
          {
            rehearsal_date: '15/04/2024',
            attending: [testUserId],
            notAttending: [testUser2, testUser3, testUser4]
          }
        ]
      })

      // @ts-expect-error mock
      SlackClient.users.list.mockResolvedValue({
        members: [
          { id: testUserId, name: 'user1' },
          { id: testUser2, name: 'user2' },
          { id: testUser3, name: 'user3' },
          { id: testUser4, name: 'user4' },
          { id: 'U05', name: 'user5' },
          { id: 'USLACKBOT', name: 'slackbot' },
          { id: 'U06', name: 'bot', is_bot: true },
          { id: 'UABSENT', name: 'absentuser' }
        ]
      })

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

      const result = await getReportBlocks(testTeamId, 'test-token')
      expect(result).toEqual([
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Responses for last 4 rehearsals:*\n20/05/2024: :+1: 3 :-1: 1\n13/05/2024: :+1: 3 :-1: 1\n06/05/2024: :+1: 1 :-1: 3\n29/04/2024: :+1: 2 :-1: 2`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Not responded in last 4 weeks:*\n<@UABSENT>`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ':chart_with_upwards_trend: *Attendance statistics* - 6 rehearsals'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Highest attendance*: 3 on 20/05/2024, 13/05/2024, 22/04/2024`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Average attendance*: 2`
          }
        }
      ])
    })
    test(`doesn't try and calculate stats when there are no results`, async () => {
      // @ts-expect-error mock
      db.setMockDbContents({
        attendance: []
      })

      const blocks = await getReportBlocks(testTeamId, 'test-token')
      expect(blocks).toHaveLength(1)
      expect(blocks[0].text.text).toContain('No data to show')
    })

    test('copes with less than 4 weeks of data', async () => {
      // @ts-expect-error mock
      db.setMockDbContents({
        attendance: [
          {
            rehearsal_date: '20/05/2024',
            attending: [testUserId, testUser2],
            notAttending: [testUser3, testUser4]
          },
          {
            rehearsal_date: '13/05/2024',
            attending: [testUserId, testUser2, testUser4],
            notAttending: [testUser3]
          }
        ]
      })

      // @ts-expect-error mock
      SlackClient.users.list.mockResolvedValue({
        members: [
          { id: testUserId, name: 'user1' },
          { id: testUser2, name: 'user2' },
          { id: testUser3, name: 'user3' },
          { id: testUser4, name: 'user4' },
          { id: 'UABSENT', name: 'absentuser' }
        ]
      })

      const blocks = await getReportBlocks(testTeamId, 'test-token')
      expect(blocks).toEqual([
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Responses for last 2 rehearsals:*\n20/05/2024: :+1: 2 :-1: 2\n13/05/2024: :+1: 3 :-1: 1`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Not responded in last 2 weeks:*\n<@UABSENT>`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ':chart_with_upwards_trend: *Attendance statistics* - 2 rehearsals'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Highest attendance*: 3 on 13/05/2024`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Average attendance*: 3`
          }
        }
      ])
    })
  })

  test('calculateAttendanceStats returns correct stats', () => {
    const data = [
      {
        date: '20/05/2024',
        attending: [testUserId, testUser2, testUser4],
        notAttending: [testUser3]
      },
      {
        date: '13/05/2024',
        attending: [testUserId, testUser2, testUser4],
        notAttending: [testUser3]
      },
      {
        date: '06/05/2024',
        attending: [testUser2],
        notAttending: [testUserId, testUser3, testUser4]
      },
      {
        date: '29/04/2024',
        attending: [testUserId, testUser2],
        notAttending: [testUser3, testUser4]
      }
    ]
    expect(calculateAttendanceStats(data)).toEqual({
      averageAttendance: 2,
      highestAttendanceValue: 3,
      highestAttendanceDates: ['20/05/2024', '13/05/2024']
    })
  })
})
