import * as utils from '../utils'
import { format, addDays } from 'date-fns'
import { postAttendanceMessage, processAttendanceForTeam } from '../attendance'
import { postRehearsalReminder } from '../rehearsals/rehearsals'
import { Request, Response } from 'express'
import { SlackClient } from '../slack/client'
import { getQueryResults } from '../db/helpers'
import { db } from '../db/db'
import { getActiveTeamsWithRehearsalOnDate } from './helpers'

export const checkForJobsToday = async (req: Request, res: Response) => {
  // Prevent illegitimate cron requests
  if (!req.headers['X-Appengine-Cron']) {
    console.error('No header found, blocking request', {
      headers: Object.keys(req.headers)
    })
    return res.sendStatus(400)
  }
  const date = new Date()
  try {
    // Process attendance on Sundays
    if (date.getDay() === 0) {
      await processAttendance()
    }
    await checkForRehearsalReminderJobs(date)
    await checkForAttendancePostJobs(date)
  } catch (err) {
    console.error(err)
    return res.sendStatus(500)
  }

  return res.sendStatus(200)
}

export async function testCronHandler(_: Request, res: Response) {
  const date = new Date()
  try {
    await checkForRehearsalReminderJobs(date, true)
    await checkForAttendancePostJobs(date, true)
  } catch (err) {
    console.error(err)
    return res.sendStatus(500)
  }

  return res.sendStatus(200)
}
async function checkForAttendancePostJobs(date: Date, dryRun?: boolean) {
  const dateISO = format(date, 'yyyy-MM-dd')
  const isBankHol = await utils.isBankHoliday(dateISO)
  if (isBankHol) return

  const teams = await getActiveTeamsWithRehearsalOnDate(date)

  teams.forEach(async (team) => {
    const {
      id,
      access_token: token,
      channel_id: channel,
      user_id,
      attendance_blocks: blocks,
      intro_text: introText
    } = team

    if (dryRun) {
      return
    }

    if (channel === '' || channel == null) {
      SlackClient.chat.postMessage({
        token: token as string,
        channel: user_id as string,
        text: "You haven't set a channel, so I can't post an attendance message. Please choose a channel by clicking on the `Home` tab!"
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

async function checkForRehearsalReminderJobs(date: Date, dryRun?: boolean) {
  const rehearsalDay = addDays(date, 4)
  const dateString = format(rehearsalDay, 'dd/MM/yyyy')
  const isBankHoliday = await utils.isBankHoliday(
    format(rehearsalDay, 'yyyy-MM-dd')
  )

  const dayOfWeek = format(rehearsalDay, 'eeee')

  const teams = await getActiveTeamsWithRehearsalOnDate(
    rehearsalDay,
    'rehearsal_reminders'
  )

  teams.forEach(async (team) => {
    const { id, access_token: token, channel_id: channel } = team
    if (channel === '' || channel == null || dryRun) return
    return await postRehearsalReminder({
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
  const allTeams = await getQueryResults(
    db.collection('teams').where('active', '==', true)
  )

  allTeams.forEach(async (team) => {
    const { id, access_token: token, channel_id: channel } = team
    if (channel === '' || channel == null) return

    return await processAttendanceForTeam({
      token: token as string,
      channel: channel as string,
      teamId: id
    })
  })
}
