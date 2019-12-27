import { Request, Response } from 'express'

import { db, getValues, getDbDoc } from '../db'
import { onSlackInstall } from './config/installation'
import { OAuthResponse } from './types'
import { SlackClient } from './client'
import { initialIntroText, initialBlocks } from './blocks/attendance'

const { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_APP_ID } = process.env
// With thanks to Dennis Alund https://medium.com/evenbit/building-a-slack-app-with-firebase-as-a-backend-151c1c98641d

const BASE_URL =
  process.env.BASE_URL ||
  `https://${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com`

export const oauth_redirect = async function(
  req: Request,
  res: Response
): Promise<Response> {
  if (!req.query && !req.query.code) {
    return res.status(401).send("Missing query attribute 'code'")
  }

  const result = await SlackClient.oauth.v2.access({
    client_id: SLACK_CLIENT_ID,
    client_secret: SLACK_CLIENT_SECRET,
    code: req.query.code
  })

  if (result.ok != null && result.ok === false) {
    console.error('Error getting OAuth access token: ' + result.error)
    return res.header('Location', `${BASE_URL}/oauth_error`).sendStatus(302)
  }

  const {
    team: { id: team_id, name: team_name },
    authed_user: { id: user_id },
    access_token,
    bot_user_id
  } = result as OAuthResponse

  let intro_text = initialIntroText
  let attendance_blocks = initialBlocks
  let rehearsal_reminders = false
  let rehearsal_day = '1'
  let google_sheet_id = ''
  let channel_id = ''
  let channel = ''

  const doc = await getDbDoc('teams', team_id)
  if (doc.exists) {
    const values = await getValues('teams', team_id, [
      'intro_text',
      'attendance_blocks',
      'rehearsal_reminders',
      'rehearsal_day',
      'google_sheet_id',
      'channel_id',
      'channel'
    ])

    intro_text = values.intro_text as string
    attendance_blocks = values.attendance_blocks as string[]
    rehearsal_reminders = values.rehearsal_reminders as boolean
    rehearsal_day = values.rehearsal_day as string
    google_sheet_id = values.google_sheet_id as string
    channel_id = values.channel_id as string
    channel = values.channel as string

    SlackClient.channels.join({
      name: channel,
      token: access_token
    })
  }

  await db
    .collection('teams')
    .doc(team_id)
    .set({
      team_name,
      user_id,
      channel_id,
      channel,
      bot_user_id,
      access_token,
      intro_text,
      attendance_blocks,
      rehearsal_reminders,
      rehearsal_day,
      google_sheet_id
    })

  await onSlackInstall({ token: access_token, userId: user_id })

  return res
    .header(
      'Location',
      `https://slack.com/app_redirect?app=${SLACK_APP_ID}&team=${team_id}`
    )
    .sendStatus(302)
}

export function oauth_success(_: Request, res: Response): Response {
  return res.send('Hooray! All authenticated.')
}
export function oauth_error(_: Request, res: Response): Response {
  return res.send('Unable to authenticate :(')
}
