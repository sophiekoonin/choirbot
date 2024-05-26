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
  if (!req.headers['X-Appengine-Cron']) {
    console.error('No header found, blocking request')
    return res.sendStatus(400)
  }
  const date = new Date()

  try {
    const dateISO = format(date, 'yyyy-MM-dd')
    const isBankHol = await isBankHoliday(dateISO)
    if (isBankHol) return
    const teams = await getActiveTeamsWithRehearsalOnDate(
      date,
      'facilitator_roulette'
    )
    teams.forEach(async (team) => {
      const {
        id,
        access_token: token,
        channel_id: channel,
        bot_user_id,
        rehearsal_timings_link
      } = team
      if (channel === '' || channel == null) return

      return await runFacilitatorRoulette(
        id,
        token as string,
        channel as string,
        bot_user_id as string,
        rehearsal_timings_link as string
      )
    })
    return res.sendStatus(200)
  } catch (err) {
    console.error(err)
    return res.sendStatus(500)
  }
}
