import { RehearsalAttendanceData, TeamId } from '../types'
import { SectionBlock } from '@slack/types'
import { getSlackUserIds } from '../utils'
import { getAttendancePosts } from '../../attendance'

function mapAttendance(
  posts: Array<FirebaseFirestore.QueryDocumentSnapshot>
): Array<RehearsalAttendanceData> {
  return posts.map((post) => ({
    attending: post.get('attending'),
    notAttending: post.get('notAttending'),
    date: post.get('rehearsal_date')
  }))
}

export function calculateAttendanceStats(
  attendanceData: Array<RehearsalAttendanceData>
) {
  const sumAttending = attendanceData.reduce(
    (acc, curr) => (acc += curr.attending.length),
    0
  )
  const averageAttendance = Math.round(sumAttending / attendanceData.length)
  const highestAttendanceValue = Math.max(
    ...attendanceData.map((data) => data.attending.length)
  )
  const highestAttendanceDates = attendanceData
    .filter((obj) => obj.attending.length === highestAttendanceValue)
    .map((obj) => obj.date)

  return {
    averageAttendance,
    highestAttendanceValue,
    highestAttendanceDates
  }
}

/*
1. Fetch last 4 rehearsals
2. Filter list of users against attending/not attending 
3. Show who hasn't responded
 */
export async function getReportBlocks(
  teamId: TeamId,
  token: string
): Promise<SectionBlock[]> {
  const allPosts = await getAttendancePosts(teamId)
  const attendanceData = mapAttendance(allPosts)

  if (attendanceData.length < 1) {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `No data to show! Check back after Choirbot has posted something.`
        }
      }
    ]
  }

  const allUsers = await getSlackUserIds(teamId, token)
  const last4WeeksOrLess = attendanceData.slice(
    0,
    Math.min(4, attendanceData.length)
  )
  const lastFourWeeksAttending = last4WeeksOrLess.map(
    (post) =>
      `${post.date}: :+1: ${post.attending.length} :-1: ${post.notAttending.length}`
  )
  const responded = last4WeeksOrLess
    .map((post) => [post.attending, post.notAttending])
    .flat(2)
  const notResponded = allUsers.filter((user) => !responded.includes(user))

  const { averageAttendance, highestAttendanceValue, highestAttendanceDates } =
    calculateAttendanceStats(attendanceData)

  const numRehearsals = last4WeeksOrLess.length
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Responses for last ${numRehearsals} rehearsals:*\n${lastFourWeeksAttending.join(
          '\n'
        )}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Not responded in last ${numRehearsals} weeks:*\n${notResponded
          .map((uid) => `<@${uid}>`)
          .join('\n')}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:chart_with_upwards_trend: *Attendance statistics* - ${attendanceData.length} rehearsals`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Highest attendance*: ${highestAttendanceValue} on ${
          highestAttendanceDates.length > 1
            ? highestAttendanceDates.join(', ')
            : highestAttendanceDates[0]
        }`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Average attendance*: ${averageAttendance}`
      }
    }
  ]
}
