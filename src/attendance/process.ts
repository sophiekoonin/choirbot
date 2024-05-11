import { getValue, updateDbValue } from '../db'
import { SlackClient } from '../slack/client'
import { MessageReactionsResult, SlackAPIArgs } from '../slack/types'
import { getUserReactionsForEmoji } from '../slack/utils'
import { getAttendancePosts } from './helpers'

export const processAttendanceForTeam = async function ({
  teamId,
  token,
  channel
}: SlackAPIArgs) {
  const botId = await getValue('teams', teamId, 'bot_user_id')
  const docs = await getAttendancePosts(teamId, 1)
  if (docs.length === 0) return
  const firstResult = docs[0]
  try {
    const response = (await SlackClient.reactions.get({
      token,
      timestamp: firstResult.get('ts'),
      channel
    })) as MessageReactionsResult
    if (!response.ok) {
      throw new Error('Failed to fetch Slack reactions')
    }
    const id = firstResult.id
    const { reactions } = response.message
    const attending = getUserReactionsForEmoji({
      reactions,
      emoji: '+1',
      botId
    })
    const notAttending = getUserReactionsForEmoji({
      reactions,
      emoji: '-1',
      botId
    })
    await updateDbValue(`attendance-${teamId}`, id, {
      attending,
      notAttending
    })
  } catch (err) {
    console.error(err)
  }
  return
}
