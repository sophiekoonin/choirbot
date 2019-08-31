const moment = require('moment')
const utils = require('./utils')
const {
  postAttendanceMessage,
  processAttendanceForTeam
} = require('./slack/attendance')
const { postRehearsalMusic } = require('./slack/rehearsals')
const { db, getQueryResults } = require('./db')

exports.checkForJobsToday = async (req, res) => {
  const date = moment()

  await checkForAttendancePostJobs(date)
  await checkForRehearsalReminderJobs(date)

  return res.sendStatus(200)
}

async function checkForAttendancePostJobs(date) {
  const dateISO = date.format('YYYY-MM-DD')
  const dateString = date.format('DD/MM/YYYY')
  const isBankHol = await utils.isBankHoliday(dateISO)
  if (isBankHol) return

  const today = date.day().toString()
  const todayQuery = await db
    .collection('teams')
    .where('rehearsal_day', '==', today)
  const teams = await getQueryResults(todayQuery)
  if (teams.length === 0) return

  teams.forEach(async team => {
    const { id, bot_access_token: token, channel_id: channel } = team
    return await postAttendanceMessage({
      token,
      channel,
      date: dateString,
      teamId: id
    })
  })
}

async function checkForRehearsalReminderJobs(date) {
  const rehearsalDay = date.add(4, 'days')
  const rehearsalDayNumber = rehearsalDay.day().toString()
  const dateString = rehearsalDay.format('DD/MM/YY')
  const isBankHoliday = await utils.isBankHoliday(rehearsalDay)
  const dayOfWeek = utils.dayNumberToString[rehearsalDay.day()]

  const todayQuery = await db
    .collection('teams')
    .where('rehearsal_day', '==', rehearsalDayNumber)
    .where('rehearsal_reminders', '==', 'true')
  const teams = await getQueryResults(todayQuery)
  if (teams.length === 0) return
  teams.forEach(async team => {
    const { id, bot_access_token: token, channel_id: channel } = team
    return await postRehearsalMusic({
      token,
      teamId: id,
      dayOfWeek,
      channel,
      date: dateString,
      isBankHoliday
    })
  })

  return
}

exports.processAttendance = async (req, res) => {
  const allTeams = await getQueryResults(await db.collection('teams'))

  await Promise.all(
    allTeams.forEach(team => {
      const { id, bot_token: token, channel_id: channel } = team
      return processAttendanceForTeam({
        token,
        channel,
        teamId: id
      })
    })
  )

  return res.sendStatus(200)
}
