import Firestore from '@google-cloud/firestore'
import { SectionBlock } from '@slack/types'

import * as google from '../google/google'
import * as db from '../db'
import { SlackClient } from './client'
import {
  ChatPostMessageResult,
  PostAttendanceMessageArgs,
  MessageReactionsResult,
  TeamId,
  SlackAPIArgs,
  UserId,
  ReactionResult
} from './types'
import { SongData } from '../google/types'

function getUserReactionsForEmoji({
  reactions,
  emoji,
  botId
}: {
  reactions: ReactionResult[]
  emoji: string
  botId: UserId
}): UserId[] {
  return (reactions.find(group => group.name === emoji)['users'] || []).filter(
    user => user !== botId
  )
}
export async function getAttendancePosts(team_id: TeamId, limit?: number) {
  const result = await db.db
    .collection(`attendance-${team_id}`)
    .orderBy('created_at', 'desc')

  if (limit != null) {
    const slice = await result.limit(limit).get()
    return slice.docs
  }

  const snapshot = await result.get()
  return snapshot.docs
}

export const postAttendanceMessage = async ({
  channel,
  token,
  teamId,
  date
}: PostAttendanceMessageArgs) => {
  const songs = await google.getNextSongs(date, teamId)
  if (songs != null && songs.mainSong.toLowerCase().includes('no rehearsal')) {
    return
  }
  try {
    const postMsgRsp = (await SlackClient.chat.postMessage({
      token,
      channel,
      as_user: false,
      username: 'Attendance Bot',
      text: `It's rehearsal day!`,
      blocks: getAttendancePostBlocks(songs)
    })) as ChatPostMessageResult

    if (!postMsgRsp.ok) {
      console.error('Unable to post attendance message', postMsgRsp.error)
      return
    }

    await SlackClient.reactions.add({
      token,
      timestamp: postMsgRsp.ts,
      channel,
      name: 'thumbsdown'
    })
    await SlackClient.reactions.add({
      token,
      timestamp: postMsgRsp.ts,
      channel,
      name: 'thumbsup'
    })

    await db.setDbValue(`attendance-${teamId}`, date, {
      rehearsal_date: date,
      created_at: Firestore.Timestamp.now().seconds,
      ts: postMsgRsp.ts,
      channel: channel,
      attending: [],
      notAttending: []
    })
  } catch (err) {
    console.error(err)
  }

  return
}

export const processAttendanceForTeam = async function({
  teamId,
  token,
  channel
}: SlackAPIArgs) {
  const botId = await db.getValue('teams', teamId, 'bot_user_id')
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
      throw new Error('Something went wrong!')
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
    await db.updateDbValue(`attendance-${teamId}`, id, {
      attending,
      notAttending
    })
  } catch (err) {
    console.error(err)
  }
  return
}

function getAttendancePostBlocks(songData: SongData): Array<SectionBlock> {
  const { mainSong, runThrough, notes } = songData

  return [
    {
      type: 'section',
      block_id: 'intro',
      text: {
        type: 'mrkdwn',
        text: '*Rehearsal day!* <!channel>'
      }
    },
    {
      type: 'section',
      block_id: 'main_song',
      text: {
        type: 'mrkdwn',
        text: `*Today's rehearsal:* ${mainSong}`
      }
    },
    {
      type: 'section',
      block_id: 'run_through',
      text: {
        type: 'mrkdwn',
        text: `*Run through*: ${runThrough}`
      }
    },
    {
      type: 'section',
      block_id: 'thumbs',
      text: {
        type: 'mrkdwn',
        text:
          'Please indicate whether or not you can attend tonight by reacting to this message with :thumbsup: (present) or :thumbsdown: (absent).'
      }
    },
    {
      type: 'section',
      block_id: 'facilitator',
      text: {
        type: 'mrkdwn',
        text: 'Facilitator please respond with :raised_hands:!'
      }
    },
    {
      type: 'section',
      block_id: 'warmup',
      text: {
        type: 'mrkdwn',
        text:
          'To volunteer for physical warmup, respond with :muscle:. \nFor musical warmup, respond with :musical_note:.'
      }
    }
  ]
}
