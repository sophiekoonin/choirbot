import { Response } from 'express'
import { Request } from '../types'
import { EventTypes } from './constants'
import { showAppHome } from './config/appHome'
import { onUninstall } from './uninstall';

export async function handleEvents(req: Request, res: Response) {
  const { team_id: team, api_app_id, event } = req.body

  // Verification handshake
  if (req.body.type === EventTypes.URL_VERIFICATION) {
    return res.send(req.body.challenge)
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
    case EventTypes.APP_UNINSTALLED:
      onUninstall(team)
      break
    default:
      return
  }
}
