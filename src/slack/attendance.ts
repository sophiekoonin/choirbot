import Firestore from '@google-cloud/firestore'

import * as google from '../google/google'
import * as db from '../db'
import { SlackClient } from './client'
import {
  ChatPostMessageResult,
  PostAttendanceMessageArgs,
  MessageReactionsResult,
  TeamId,
  SlackAPIArgs
} from './types'
import { SongData } from '../google/types'

const { NODE_ENV } = process.env

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
  if (songs.mainSong.toLowerCase().includes('no rehearsal')) {
    return
  }
  const text = getAttendancePostMessage(songs)
  try {
    const postMsgRsp = (await SlackClient.chat.postMessage({
      token,
      channel,
      as_user: false,
      username: 'Attendance Bot',
      text
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

    if (NODE_ENV === 'prod') {
      await db.setDbValue(`attendance-${teamId}`, date, {
        rehearsal_date: date,
        created_at: Firestore.Timestamp.now().seconds,
        ts: postMsgRsp.ts,
        channel: channel,
        attending: [],
        notAttending: []
      })
    }
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
    const attending =
      reactions.find(group => group.name === '+1')['users'] || []
    const notAttending =
      reactions.find(group => group.name === '-1')['users'] || []
    await db.updateDbValue(`attendance-${teamId}`, id, {
      attending,
      notAttending
    })
  } catch (err) {
    console.error(err)
    return
  }
  return
}

function getAttendancePostMessage({
  mainSong = 'please check schedule for details!',
  runThrough,
  notes
}: SongData): string {
  return (
    ':dancing_banana: Rehearsal day! :dancing_banana: <!channel> \n' +
    `*Today's rehearsal:* ${mainSong}\n` +
    ` ${runThrough ? `*Run through:* ${runThrough}\n\n` : ''}` +
    ` ${
      notes.toLowerCase().includes('team updates')
        ? '*Team updates meeting at 6:30! All welcome* :tada:\n'
        : ''
    }` +
    'Please indicate whether or not you can attend tonight by reacting to this message with :thumbsup: ' +
    '(present) or :thumbsdown: (absent).\n' +
    'Facilitator please respond with :raised_hands:!\n' +
    'To volunteer for Physical warm up, respond with :muscle: ' +
    'For Musical warm up, respond with :musical_note:.'
  )
}
