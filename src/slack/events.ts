import { Response } from 'express'
import { Request } from '../types'
import { EventTypes } from './constants'
import { showAppHome } from './appHome'

export async function handleEvents(req: Request, res: Response) {
  const { team_id: team, api_app_id, challenge, event } = req.body

  // Verification handshake
  if (challenge != null) {
    return res.send(challenge)
  }
  if (api_app_id !== process.env.SLACK_APP_ID) {
    return res.status(400).send()
  }

  res.sendStatus(200)
  const { type, user } = event

  switch (type) {
    case EventTypes.APP_HOME_OPENED:
      showAppHome({ user, team })
      break
    default:
      return
  }
}
