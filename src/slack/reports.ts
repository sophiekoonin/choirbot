import slack from 'slack'
import { getAttendancePosts } from './attendance'
import { getToken } from './auth'

function flattenDeep(arr1) {
  return arr1.reduce(
    (acc, val) =>
      Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val),
    []
  )
}

function mapAttendance(posts) {
  return posts.map(post => ({
    attending: post.get('attending'),
    notAttending: post.get('notAttending'),
    date: post.get('rehearsal_date')
  }))
}

async function getSlackUsers(teamId) {
  const token = await getToken(teamId)
  const { members } = await slack.users.list({ token })
  return members
    .filter(member => !member.deleted)
    .filter(member => !member.is_bot)
    .filter(member => member.id !== 'USLACKBOT')
}

async function getSlackUserIds(team_id) {
  const token = await getToken(team_id)
  const { members } = await slack.users.list({ token })
  return members
    .filter(member => !member.deleted)
    .filter(member => !member.is_bot)
    .map(member => member.id)
    .filter(id => id !== 'USLACKBOT')
}

function getAttendanceValue(attendance, user_id) {
  if (attendance.attending.includes(user_id)) {
    return 'present'
  } else if (attendance.notAttending.includes(user_id)) {
    return 'absent'
  }
  return 'unknown'
}

export const getAttendanceReport = async function(teamId) {
  const allUsers = await getSlackUsers(teamId)
  const attendanceRecords = await getAttendancePosts(teamId, 10)
  const allAttendance = mapAttendance(attendanceRecords)

  const allDates = allAttendance.map(record => record.date).sort()

  const usersWithAttendance = allUsers.map(user => {
    const attendance = allAttendance.reduce((acc, curr) => {
      acc[curr.date] = getAttendanceValue(curr, user.id)
      return acc
    }, {})

    return {
      name: user.profile['real_name'],
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
export const reportAttendance = async function(teamId) {
  const lastFourWeeks = await getAttendancePosts(teamId, 4)
  const allUsers = await getSlackUserIds(teamId)
  const postData = mapAttendance(lastFourWeeks)
  const responded = flattenDeep(
    postData.map(post => [post.attending, post.notAttending])
  )
  const notResponded = allUsers.filter(user => !responded.includes(user))
  return `*Not responded in last 4 weeks:* \n${notResponded
    .map(uid => `<@${uid}>`)
    .join('\n')}`
}

export const getStats = async function getStats(teamId) {
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
