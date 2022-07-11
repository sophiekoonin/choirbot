import Firestore from '@google-cloud/firestore'
import { SectionBlock } from '@slack/types'
import { format } from 'date-fns'
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
import { introductionBlock, AttendanceBlocks } from './blocks/attendance'

function getUserReactionsForEmoji({
  reactions,
  emoji,
  botId
}: {
  reactions: ReactionResult[]
  emoji: string
  botId: UserId
}): UserId[] {
  return (
    reactions.find((group) => group.name === emoji)['users'] || []
  ).filter((user) => user !== botId)
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

export const updateAttendanceMessage = async ({
  token,
  teamId
}: {
  token: string
  teamId: string
}) => {
  const recentAttendancePosts = await getAttendancePosts(teamId, 1)
  if (recentAttendancePosts == null || recentAttendancePosts.length === 0) {
    await SlackClient.chat.postMessage({
      token,
      channel: await db.getValue('teams', teamId, 'user_id'),
      text: `Tried to update attendance message, but couldn't find the post to update.`
    })
    return
  }
  const mostRecentPost = recentAttendancePosts[0]
  const timestamp = mostRecentPost.get('ts')
  const channel = mostRecentPost.get('channel')
  const dateString = mostRecentPost.get('rehearsal_date')

  const songs = await google.getNextSongs(dateString, teamId)
  if (songs != null && songs.mainSong.toLowerCase().includes('no rehearsal')) {
    return
  }
  const team = await db.getDocData('teams', teamId)
  if (songs == null) {
    await SlackClient.chat.postMessage({
      token,
      channel: await team.get('user_id'),
      text: `Tried to post attendance message, but couldn't find a row for ${dateString} in the schedule. Please make sure the dates are correct!`
    })
    return
  }
  const messageBlocks = getAttendancePostBlocks({
    songs,
    blocks: team.attendance_blocks,
    introText: team.intro_text
  })

  await SlackClient.chat.update({
    token,
    ts: timestamp,
    channel,
    text: "It's rehearsal day!",
    blocks: messageBlocks
  })
}

export const postAttendanceMessage = async ({
  channel,
  token,
  teamId,
  date,
  blocks,
  introText
}: PostAttendanceMessageArgs) => {
  const dateISO = format(date, 'yyyy-MM-dd')
  const dateString = format(date, 'dd/MM/yyyy')
  const songs = await google.getNextSongs(dateString, teamId)
  if (songs != null && songs.mainSong.toLowerCase().includes('no rehearsal')) {
    return
  }
  if (songs == null) {
    await SlackClient.chat.postMessage({
      token,
      channel: await db.getValue('teams', teamId, 'user_id'),
      text: `Tried to post attendance message, but couldn't find a row for ${dateString} in the schedule. Please make sure the dates are correct!`
    })
    return
  }
  const messageBlocks = getAttendancePostBlocks({
    songs,
    blocks,
    introText
  })
  try {
    const postMsgRsp = (await SlackClient.chat.postMessage({
      token,
      channel,
      username: 'Attendance Bot',
      text: `It's rehearsal day!`,
      blocks: messageBlocks
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

    await db.setDbValue(`attendance-${teamId}`, dateISO, {
      rehearsal_date: dateString,
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

export const processAttendanceForTeam = async function ({
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

export function getAttendancePostBlocks({
  songs,
  blocks,
  introText
}: {
  songs: SongData
  blocks: string[]
  introText: string
}): Array<SectionBlock> {
  return [
    introductionBlock(introText),
    ...blocks
      .map((blockName) => {
        const block = AttendanceBlocks[blockName]
        return typeof block === 'function' ? block(songs) : block
      })
      .filter((block) => block != null)
  ]
}
