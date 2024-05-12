import * as utils from '../utils'
import { format, addDays } from 'date-fns'
import { postAttendanceMessage, processAttendanceForTeam } from '../attendance'
import { postRehearsalReminder } from '../rehearsals/rehearsals'
import { Request, Response } from 'express'
import { SlackClient } from '../slack/client'
import { getQueryResults } from '../db/helpers'
import { db } from '../db/db'
import { getActiveTeamsWithRehearsalOnDate } from './helpers'
import { runFacilitatorRoulette } from '../facilitatorRoulette'

export const checkForJobsToday = async (req: Request, res: Response) => {
  // Prevent illegitimate cron requests
  if (!req.headers['x-appengine-cron']) {
    return res.sendStatus(400)
  }
  const date = new Date()

  // Process attendance on Sundays
  if (date.getDay() === 0) {
    await processAttendance()
  }

  await checkForAttendancePostJobs(date)
  await checkForRehearsalReminderJobs(date)

  return res.sendStatus(200)
}

export async function checkFacilitatorRoulette(date: Date) {
  const dateISO = format(date, 'yyyy-MM-dd')
  const isBankHol = await utils.isBankHoliday(dateISO)
  if (isBankHol) return

  const teams = await getActiveTeamsWithRehearsalOnDate(
    date,
    'facilitator_roulette'
  )
  console.log(teams)
  teams.forEach(async (team) => {
    const { id, access_token: token, channel_id: channel, bot_user_id } = team
    if (channel === '' || channel == null) return

    return await runFacilitatorRoulette(
      id,
      token as string,
      channel as string,
      bot_user_id as string
    )
  })
}

async function checkForAttendancePostJobs(date: Date) {
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

async function checkForRehearsalReminderJobs(date: Date) {
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
    if (channel === '' || channel == null) return
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
