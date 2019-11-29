import { Request, Response } from 'express'
import fetch from 'node-fetch'
import querystring from 'querystring'
import { db } from '../db'
import { onSlackInstall } from './config'
import { OAuthResponse, OAuthError } from './types'

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
  const queryParams = {
    code: req.query.code,
    client_id: SLACK_CLIENT_ID,
    client_secret: SLACK_CLIENT_SECRET,
    redirect_uri: `${BASE_URL}/oauth_redirect`
  }

  const encodedQueryString = querystring.stringify(queryParams)
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf8'
    }
  }

  const response = await fetch(
    `https://slack.com/api/oauth.access?${encodedQueryString}`,
    options
  )

  const responseJson = (await response.json()) as OAuthResponse | OAuthError
  if (response.ok != null && response.ok === false) {
    console.error('Error: ' + JSON.stringify(responseJson))
    return res.header('Location', `${BASE_URL}/oauth_error`).sendStatus(302)
  }

  const {
    incoming_webhook,
    team_id,
    team_name,
    user_id,
    access_token,
    bot
  } = responseJson as OAuthResponse

  const { bot_user_id, bot_access_token } = bot
  const { channel_id, channel } = incoming_webhook

  await db
    .collection('teams')
    .doc(team_id)
    .set({
      team_name,
      user_id,
      channel_id,
      channel,
      bot_user_id,
      bot_access_token,
      token: access_token
    })
  onSlackInstall({ token: bot_access_token, userId: user_id })

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
