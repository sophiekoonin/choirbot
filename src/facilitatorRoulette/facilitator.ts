import { getMostRecentAttendancePost, getReactionsForPost } from '../attendance'
import { updateDbValue } from '../db'
import { SlackClient } from '../slack/client'
import { Emoji } from '../slack/constants'
import { getUserReactionsForEmoji } from '../slack/utils'
import { pickRandomAttendee } from './helpers'

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
  let shouldPostMessage = false
  // First, has anyone already volunteered?
  const facilitatorReactions = getUserReactionsForEmoji({
    reactions,
    emoji: Emoji.Facilitator
  })
  if (facilitatorReactions.length > 0) {
    facilitatorUserId = facilitatorReactions[0]
  } else {
    // Otherwise, choose one of the people attending to facilitate
    // We ensure they haven't facilitated in the last 4 weeks to be a bit fairer
    // and make sure they didn't volunteer for any other roles.
    // If they have, choose another person
    const musicalWarmUpVolunteer =
      getUserReactionsForEmoji({
        reactions,
        emoji: Emoji.GeneralWarmup
      })[0] || null
    const physicalWarmUpVolunteer =
      getUserReactionsForEmoji({
        reactions,
        emoji: Emoji.PhysicalWarmup
      })[0] || null

    const attendees = getUserReactionsForEmoji({
      reactions,
      emoji: Emoji.Attending,
      botId
    })
    if (attendees.length === 0) {
      return
    }
    facilitatorUserId = await pickRandomAttendee(
      attendees,
      teamId,
      musicalWarmUpVolunteer,
      physicalWarmUpVolunteer
    )
    shouldPostMessage = true
  }

  if (facilitatorUserId == null) {
    SlackClient.chat.postMessage({
      token,
      thread_ts: ts,
      channel,
      reply_broadcast: true,
      text: ":raised_hands::warning: I tried to pick a facilitator for today's rehearsal but I wasn't able to. Please can someone volunteer?"
    })
    return
  }

  // Persist the user ID of our facilitator so we can track who's facilitated
  await updateDbValue(`attendance-${teamId}`, post.id, {
    roles: { facilitator: facilitatorUserId }
  })

  if (!shouldPostMessage) {
    return
  }

  SlackClient.chat.postMessage({
    token,
    thread_ts: ts,
    channel,
    reply_broadcast: true,
    text: `:8ball: Nobody volunteered to facilitate today, so I'm shaking the magic 8 ball. Today's randomly-chosen facilitator is <@${facilitatorUserId}>!`
  })

  return
}
