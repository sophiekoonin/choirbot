import { isAwaitKeyword } from 'typescript'
import { getValue, updateDbValue } from '../db'
import { SlackClient } from '../slack/client'
import { MessageReactionsResult, SlackAPIArgs } from '../slack/types'
import { getUserReactionsForEmoji } from '../slack/utils'
import {
  getAttendancePosts,
  getMostRecentAttendancePost,
  getReactionsForPost
} from './helpers'

export const processAttendanceForTeam = async function ({
  teamId,
  token,
  channel
}: SlackAPIArgs) {
  const botId = await getValue('teams', teamId, 'bot_user_id')
  const post = await getMostRecentAttendancePost(teamId)
  if (post == null) return
  const timestamp = post.get('ts')
  const reactions = await getReactionsForPost(token, channel, timestamp)
  if (reactions == null) return
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
  await updateDbValue(`attendance-${teamId}`, post.id, {
    attending,
    notAttending
  })

  return
}
