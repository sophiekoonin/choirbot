import { Request, Response } from 'express'
import { SlackClient } from './client'
import { getValues } from '../db'

export async function testSlackIntegration(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const { team_id: teamId }: { team_id: string } = req.query
    if (!teamId || teamId === '') {
      return res.sendStatus(200)
    }
    const [userId, token] = await getValues('teams', teamId, [
      'user_id',
      'bot_access_token'
    ])

    await SlackClient.chat.postMessage({
      token,
      text: 'Test post, please ignore!',
      username: 'Attendance Bot Test',
      as_user: true,
      channel: userId
    })
    return res.sendStatus(200)
  } catch (err) {
    console.error('Error trying to test slack:', err)
    return res.sendStatus(500)
  }
}
