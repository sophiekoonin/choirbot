import { Request, Response } from 'express'
import { runFacilitatorRoulette } from '../facilitatorRoulette'
import { getActiveTeamsWithRehearsalOnDate } from './helpers'
import { format } from 'date-fns'
import { isBankHoliday } from '../utils'

export async function runFacilitatorRouletteCronJob(
  req: Request,
  res: Response
) {
  // Prevent illegitimate cron requests
  if (!req.headers['x-appengine-cron']) {
    return res.sendStatus(400)
  }
  const date = new Date()

  const dateISO = format(date, 'yyyy-MM-dd')
  const isBankHol = await isBankHoliday(dateISO)
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
  return res.sendStatus(200)
}
