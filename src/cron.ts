import moment from 'moment'
import * as utils from './utils'
import {
  postAttendanceMessage,
  processAttendanceForTeam
} from './slack/attendance'
import { postRehearsalMusic } from './slack/rehearsals'
import { db, getQueryResults } from './db'
import { Request, Response } from 'express'
import { SlackClient } from './slack/client'

export const checkForJobsToday = async (req: Request, res: Response) => {
  // Prevent illegitimate cron requests
  if (!req.headers['x-appengine-cron']) {
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
  const isBankHol = await utils.isBankHoliday(dateISO)
  if (isBankHol) return

  const today = date.day().toString()
  const todayQuery = db.collection('teams').where('rehearsal_day', '==', today).where('active', '==', true)
  const teams = await getQueryResults(todayQuery)
  if (teams.length === 0) return

  teams.forEach(async team => {
    const {
      id,
      access_token: token,
      channel_id: channel,
      user_id,
      attendance_blocks: blocks,
      intro_text: introText
    } = team
    if (channel === '' || channel == null) {
      SlackClient.chat.postMessage({
        token: token as string,
        channel: user_id as string,
        text:
          "You haven't set a channel, so I can't post an attendance message. Please choose a channel by clicking on the `Home` tab!"
      })
      return
    }

    return await postAttendanceMessage({
      token: token as string,
      channel: channel as string,
      date,
      teamId: id,
      introText: introText as string,
      blocks: blocks as string[]
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
    .where('active', '==', true)
  const teams = await getQueryResults(todayQuery)
  if (teams.length === 0) return
  teams.forEach(async team => {
    const { id, access_token: token, channel_id: channel } = team
    if (channel === '' || channel == null) return
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
  const allTeams = await getQueryResults(db.collection('teams').where('active', '==', true))

  allTeams.forEach(async team => {
    const { id, access_token: token, channel_id: channel } = team
    if (channel === '' || channel == null) return

    return await processAttendanceForTeam({
      token: token as string,
      channel: channel as string,
      teamId: id
    })
  })
}
