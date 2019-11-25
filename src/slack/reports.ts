import { getAttendancePosts } from './attendance'
import { getToken } from './auth'
import {
  RehearsalAttendanceData,
  UserId,
  ListUsersResult,
  SlackUser,
  SingleUserAttendance,
  TeamId,
  AttendanceData
} from './types'
import { SlackClient } from './client'

function mapAttendance(
  posts: Array<FirebaseFirestore.QueryDocumentSnapshot>
): Array<RehearsalAttendanceData> {
  return posts.map(post => ({
    attending: post.get('attending'),
    notAttending: post.get('notAttending'),
    date: post.get('rehearsal_date')
  }))
}

async function getSlackUsers(teamId: TeamId): Promise<Array<SlackUser>> {
  const token = await getToken(teamId)
  const { members } = (await SlackClient.users.list({
    token
  })) as ListUsersResult
  return members
    .filter(member => !member.deleted)
    .filter(member => !member.is_bot)
    .filter(member => member.id !== 'USLACKBOT')
}

async function getSlackUserIds(team_id: TeamId): Promise<Array<UserId>> {
  const token = await getToken(team_id)
  const { members } = (await SlackClient.users.list({
    token
  })) as ListUsersResult
  return members
    .filter(member => !member.deleted)
    .filter(member => !member.is_bot)
    .map(member => member.id)
    .filter(id => id !== 'USLACKBOT')
}

function getAttendanceValue(
  attendance: RehearsalAttendanceData,
  user_id: UserId
): string {
  if (attendance.attending.includes(user_id)) {
    return 'present'
  } else if (attendance.notAttending.includes(user_id)) {
    return 'absent'
  }
  return 'unknown'
}

export async function getAttendanceReport(teamId: TeamId) {
  const allUsers = await getSlackUsers(teamId)
  const attendanceRecords = await getAttendancePosts(teamId, 10)
  const allAttendance = mapAttendance(attendanceRecords)

  const allDates = allAttendance.map(record => record.date).sort()

  const usersWithAttendance = allUsers.map((user: SlackUser) => {
    const attendance = allAttendance.reduce(
      (acc: AttendanceData, curr: RehearsalAttendanceData) => {
        acc[curr.date] = getAttendanceValue(curr, user.id)
        return acc
      },
      {}
    )

    return {
      name: user.real_name,
      attendance: attendance
    }
  })
  return {
    dates: allDates,
    users: usersWithAttendance
  }
}

/*
1. Fetch last 4 rehearsals
2. Filter list of users against attending/not attending 
3. Show who hasn't responded
 */
export async function reportAttendance(teamId: TeamId) {
  const lastFourWeeks = await getAttendancePosts(teamId, 4)
  const allUsers = await getSlackUserIds(teamId)
  const postData = mapAttendance(lastFourWeeks)
  const responded = postData
    .map(post => [post.attending, post.notAttending])
    .flat(2)
  const notResponded = allUsers.filter(user => !responded.includes(user))
  return `*Not responded in last 4 weeks:* \n${notResponded
    .map(uid => `<@${uid}>`)
    .join('\n')}`
}

export async function getStats(teamId: TeamId) {
  const allPosts = await getAttendancePosts(teamId)
  const allUsers = await getSlackUserIds(teamId)
  const attendanceData = mapAttendance(allPosts)
  const sumAttending = attendanceData.reduce(
    (acc, curr) => (acc += curr.attending.length),
    0
  )
  const averageAttendance = sumAttending / attendanceData.length
  const highestAttendanceValue = Math.max.apply(
    Math,
    attendanceData.map(data => data.attending.length)
  )
  const highestAttendanceDates = attendanceData
    .filter(obj => obj.attending.length === highestAttendanceValue)
    .map(obj => obj.date)

  const membersToTotalAttendance = allUsers.map(user => ({
    id: user,
    attended: attendanceData.reduce(
      (acc, curr) => (curr.attending.includes(user) ? (acc += 1) : acc),
      0
    )
  }))
  const highestAttended = Math.max.apply(
    Math,
    membersToTotalAttendance.map(data => data.attended)
  )
  const highestAttendanceMembers = membersToTotalAttendance
    .filter(m => m.attended === highestAttended)
    .map(m => `<@${m.id}>`)
    .join(',')

  return `:chart_with_upwards_trend: *Attendance statistics* - ${
    attendanceData.length
  } rehearsals\n
*Highest attendance*: ${highestAttendanceValue} on ${
    highestAttendanceDates.length > 1
      ? highestAttendanceDates.join(', ')
      : highestAttendanceDates[0]
  }
*Average attendance*: ${averageAttendance}
*Most rehearsals attended:* ${highestAttendanceMembers} - ${highestAttended}`
}
