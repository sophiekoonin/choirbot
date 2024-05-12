import {
  getMostRecentAttendancePost,
  getReactionsForPost
} from '../attendance/helpers'
import { getUserReactionsForEmoji } from '../slack/utils'

export async function getVolunteerFacilitator(
  teamId: string,
  token: string,
  channel: string
) {
  const post = await getMostRecentAttendancePost(teamId)
  if (!post) {
    return
  }
  const ts = post.get('ts')
  const reactions = await getReactionsForPost(token, channel, ts)
  const facilitator = getUserReactionsForEmoji({
    reactions,
    emoji: 'raised_hands'
  })
  if (facilitator.length === 0) return null
  return facilitator[0]
}
