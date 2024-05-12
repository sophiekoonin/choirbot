import { getMostRecentAttendancePost, getReactionsForPost } from '../attendance'
import { updateDbValue } from '../db'
import { getUserReactionsForEmoji } from '../slack/utils'
import { getVolunteerFacilitator } from './helpers'

export async function runFacilitatorRoulette(
  teamId: string,
  token: string,
  channel: string,
  botId: string
): Promise<void> {
  let facilitatorUserId: string | null = null
  const post = await getMostRecentAttendancePost(teamId)
  if (!post) {
    return
  }
  const ts = post.get('ts')
  const reactions = await getReactionsForPost(token, channel, ts)

  // First, has anyone already volunteered?
  const facilitatorReactions = getUserReactionsForEmoji({
    reactions,
    emoji: 'raised_hands'
  })
  if (facilitatorReactions.length > 0) {
    facilitatorUserId = facilitatorReactions[0]
  } else {
    // Otherwise, choose one of the people attending to facilitate
    // Ensure they haven't facilitated in the last 4 weeks to be a bit fairer
    // If they have, choose another person
    const attendees = getUserReactionsForEmoji({
      reactions,
      emoji: '+1',
      botId
    })
    if (attendees.length === 0) {
      return
    }
  }

  // Persist the user ID of our facilitator so we can track who's facilitated
  await updateDbValue(`attendance-${teamId}`, post.id, {
    roles: { facilitator: facilitatorUserId }
  })
  return
}
