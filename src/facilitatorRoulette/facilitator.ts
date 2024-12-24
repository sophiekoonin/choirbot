import { format } from 'date-fns'
import { getMostRecentAttendancePost, getReactionsForPost } from '../attendance'
import { updateDbValue } from '../db'
import { SlackClient } from '../slack/client'
import { Actions, Emoji } from '../slack/constants'
import { getUserReactionsForEmoji } from '../slack/utils'
import { pickRandomAttendee } from './helpers'
import { SectionBlock } from '@slack/web-api'
import { isThereARehearsalToday } from '../google/google'

export async function runFacilitatorRoulette(
  teamId: string,
  token: string,
  channel: string,
  botId: string,
  rehearsalTimingsLink: string,
  prevFacilitator?: string
): Promise<void> {
  let facilitatorUserId: string | null = null
  const hasRehearsal = await isThereARehearsalToday(teamId)
  if (!hasRehearsal) {
    console.info('No rehearsal today, exiting')
    return
  }

  const post = await getMostRecentAttendancePost(teamId)
  if (!post) {
    console.info('No post found, exiting')
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
    }).filter((userId) => (prevFacilitator ? userId !== prevFacilitator : true))
    if (attendees.length === 0) {
      console.log('no attendees')
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
    console.log('nothing to do')
    return
  }

  const blocks: SectionBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:8ball: Nobody volunteered to facilitate today, so we're shaking the magic 8 ball. Today's randomly-chosen facilitator is <@${facilitatorUserId}>!\n\n⌚️ <${rehearsalTimingsLink}|Rehearsal timings>`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `If you can't facilitate today, please tap "Decline".`
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Decline',
          emoji: true
        },
        value: 'decline_facilitator',
        action_id: Actions.DECLINE_FACILITATOR
      }
    }
  ]

  await SlackClient.chat.postMessage({
    token,
    thread_ts: ts,
    channel,
    reply_broadcast: true,
    blocks,
    unfurl_links: false,
    unfurl_media: false,
    text: `:8ball: <@${facilitatorUserId}> is facilitating today's rehearsal! :8ball:`
  })

  return
}

export async function rerollFacilitator(
  teamId: string,
  token: string,
  channel: string,
  botId: string,
  rehearsalTimingsLink: string,
  actorId: string // the person who chose to decline
): Promise<void> {
  const date = format(new Date(), 'yyyy-MM-dd')

  // Reset the facilitator role for today
  await updateDbValue(`attendance-${teamId}`, date, {
    roles: { facilitator: null }
  })

  return runFacilitatorRoulette(
    teamId,
    token,
    channel,
    botId,
    rehearsalTimingsLink,
    actorId
  )
}
