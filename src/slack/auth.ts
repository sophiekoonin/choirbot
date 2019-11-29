import crypto from 'crypto'
import timingSafeCompare from 'tsscmp'

import { getValue } from '../db'
import { VerificationHeaders } from './types'
import { Response, NextFunction } from 'express'
import { Request } from '../types'
import { ConsoleLogger } from '@slack/logger'

export async function getToken(team_id: string) {
  return await getValue('teams', team_id, 'token')
}

/**
 * Method to verify signature of requests - COURTESY OF SLACK SDK
 * https://github.com/slackapi/node-slack-sdk/
 *
 * @param signingSecret - Signing secret used to verify request signature
 * @param requestHeaders - The signing headers. If `req` is an incoming request, then this should be `req.headers`.
 * @param body - Raw body string
 * @returns Indicates if request is verified
 */
export function verifyRequestSignature(
  req: Request,
  res: Response,
  next: NextFunction
): Response {
  const signingSecret = process.env.SLACK_SIGNING_SECRET
  const requestHeaders = req.headers as VerificationHeaders
  // Request signature
  const signature = requestHeaders['x-slack-signature']
  // Request timestamp
  const ts = parseInt(requestHeaders['x-slack-request-timestamp'], 10)

  // Divide current date to match Slack ts format
  // Subtract 5 minutes from current time
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5

  if (ts < fiveMinutesAgo) {
    return res.status(200).send({
      response_type: 'ephemeral',
      text:
        "Sorry, that didn't work. Please try again. (Error: signing secret too old)"
    })
  }
  const hmac = crypto.createHmac('sha256', signingSecret)
  const [version, hash] = signature.split('=')
  hmac.update(`${version}:${ts}:${req.text}`)

  if (!timingSafeCompare(hash, hmac.digest('hex'))) {
    return res.status(200).send({
      response_type: 'ephemeral',
      text:
        "Sorry, that didn't work. Please try again. (Error: signing secret could not be verified)"
    })
  }

  next()
}
