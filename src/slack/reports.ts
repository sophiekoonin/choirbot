import { getAttendancePosts } from './attendance'
import { RehearsalAttendanceData, TeamId } from './types'
import { SectionBlock } from '@slack/types'
import { getSlackUserIds } from './utils'

function mapAttendance(
  posts: Array<FirebaseFirestore.QueryDocumentSnapshot>
): Array<RehearsalAttendanceData> {
  return posts.map(post => ({
    attending: post.get('attending'),
    notAttending: post.get('notAttending'),
    date: post.get('rehearsal_date')
  }))
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
    return [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `No data to show! Check back after SHEBot has posted something.`
      }
    }]
  } 

  const allUsers = await getSlackUserIds(teamId, token)
  const lastFourWeeks = attendanceData.slice(0, 4)
  const lastFourWeeksAttending = lastFourWeeks.map(
    post =>
      `${post.date}: :+1: ${post.attending.length} :-1: ${post.notAttending.length}`
  )
  const responded = lastFourWeeks
    .map(post => [post.attending, post.notAttending])
    .flat(2)
  const notResponded = allUsers.filter(user => !responded.includes(user))

  const sumAttending = attendanceData.reduce(
    (acc, curr) => (acc += curr.attending.length),
    0
  )
  const averageAttendance = Math.round(sumAttending / attendanceData.length)
  const highestAttendanceValue = Math.max.apply(
    Math,
    attendanceData.map(data => data.attending.length)
  )
  const highestAttendanceDates = attendanceData
    .filter(obj => obj.attending.length === highestAttendanceValue)
    .map(obj => obj.date)
  

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Responses for last 4 rehearsals:*\n${lastFourWeeksAttending.join(
          '\n'
        )}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Not responded in last 4 weeks:*\n${notResponded
          .map(uid => `<@${uid}>`)
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
