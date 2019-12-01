import moment from 'moment'
import * as utils from './utils'
import {
  postAttendanceMessage,
  processAttendanceForTeam
} from './slack/attendance'
import { postRehearsalMusic } from './slack/rehearsals'
import { db, getQueryResults } from './db'
import { Request, Response } from 'express'

export const checkForJobsToday = async (req: Request, res: Response) => {
  // Prevent illegitimate cron requests
  if (!req.headers['X-Appengine-Cron']) {
    return res.sendStatus(400)
  }
  const date = moment()

  // Process attendance on Sundays
  if (date.day() === 0) {
    await processAttendance()
  }

  await checkForAttendancePostJobs(date)
  await checkForRehearsalReminderJobs(date)

  return res.sendStatus(200)
}

async function checkForAttendancePostJobs(date: moment.Moment) {
  const dateISO = date.format('YYYY-MM-DD')
  const dateString = date.format('DD/MM/YYYY')
  const isBankHol = await utils.isBankHoliday(dateISO)
  if (isBankHol) return

  const today = date.day().toString()
  const todayQuery = db.collection('teams').where('rehearsal_day', '==', today)
  const teams = await getQueryResults(todayQuery)
  if (teams.length === 0) return

  teams.forEach(async team => {
    const { id, bot_access_token: token, channel_id: channel } = team
    return await postAttendanceMessage({
      token: token as string,
      channel: channel as string,
      date: dateString,
      teamId: id
    })
  })
}

async function checkForRehearsalReminderJobs(date: moment.Moment) {
  const rehearsalDay = date.add(4, 'days')
  const rehearsalDayNumber = rehearsalDay.day().toString()
  const dateString = rehearsalDay.format('DD/MM/YYYY')
  const isBankHoliday = await utils.isBankHoliday(
    rehearsalDay.format('YYYY-MM-DD')
  )
  const dayOfWeek = rehearsalDay.format('dddd')

  const todayQuery = db
    .collection('teams')
    .where('rehearsal_day', '==', rehearsalDayNumber)
    .where('rehearsal_reminders', '==', 'true')
  const teams = await getQueryResults(todayQuery)
  if (teams.length === 0) return
  teams.forEach(async team => {
    const { id, bot_access_token: token, channel_id: channel } = team
    return await postRehearsalMusic({
      token: token as string,
      teamId: id,
      dayOfWeek,
      channel: channel as string,
      date: dateString,
      isBankHoliday
    })
  })

  return
}

export const processAttendance = async () => {
  const allTeams = await getQueryResults(db.collection('teams'))

  allTeams.forEach(async team => {
    const { id, bot_access_token: token, channel_id: channel } = team
    return await processAttendanceForTeam({
      token: token as string,
      channel: channel as string,
      teamId: id
    })
  })
}
