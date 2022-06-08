import Firestore from '@google-cloud/firestore'
import { SectionBlock, ActionsBlock } from '@slack/types'
import { format, getUnixTime } from 'date-fns'
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
import { AttendancePostButtons } from './constants'

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

const prepareAttendancePostData = async ({
  teamId,
  token,
  dateString,
  roles,
  blocks,
  introText
}: {
  teamId: string
  token: string
  dateString: string
  roles: { [role: string]: string }
  blocks: string[]
  introText: string
}) => {
  const songs = await google.getNextSongs(dateString, teamId)
  if (songs != null && songs.mainSong.toLowerCase().includes('no rehearsal')) {
    return
  }
  if (songs == null) {
    await SlackClient.chat.postMessage({
      token,
      channel: await db.getValue('teams', teamId, 'user_id'),
      text: `Tried to post or update attendance message, but couldn't find a row for ${dateString} in the schedule. Please make sure the dates are correct!`
    })
    return
  }
  return getAttendancePostBlocks({
    songs,
    blocks,
    roles,
    introText
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
  const dateString = format(date, 'dd/MM/yyyy')
  const messageBlocks = await prepareAttendancePostData({
    teamId,
    token,
    dateString,
    roles: {},
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

    await db.setDbValue(`attendance-${teamId}`, postMsgRsp.ts, {
      rehearsal_date: dateString,
      created_at: Firestore.Timestamp.now().seconds,
      ts: postMsgRsp.ts,
      channel: channel,
      attending: [],
      notAttending: [],
      roles: {}
    })
  } catch (err) {
    console.error(err)
  }

  return
}

export async function updateAttendancePost({
  teamId,
  ts,
  dateString,
  channel,
  token,
  roles,
  blocks,
  introText
}: Omit<PostAttendanceMessageArgs, 'date'> & {
  ts: string
  roles: { [role: string]: string }
  dateString: string
}) {
  const messageBlocks = await prepareAttendancePostData({
    teamId,
    token,
    dateString,
    roles,
    blocks,
    introText
  })

  await SlackClient.chat.update({
    token,
    channel,
    ts,
    blocks: messageBlocks,
    text: `It's rehearsal day!`
  })
}
export const updateAttendancePostRoles = async function ({
  teamId,
  token,
  postTimestamp,
  roleName,
  userId
}: {
  teamId: string
  token: string
  postTimestamp: string
  roleName: string
  userId?: string
}) {
  try {
    const post = await db.getDocData(`attendance-${teamId}`, postTimestamp)
    const { rehearsal_date } = post
    const roles = post['roles'] || {}
    const { [roleName]: _, ...restRoles } = roles
    const newRoles = userId ? { ...restRoles, [roleName]: userId } : restRoles
    await db.updateDbValue(`attendance-${teamId}`, postTimestamp, {
      roles: newRoles
    })

    const {
      attendance_blocks: blocks,
      intro_text: introText,
      channel_id: channel
    } = await db.getValues('teams', teamId, [
      'access_token',
      'channel_id',
      'attendance_blocks',
      'intro_text'
    ])

    await updateAttendancePost({
      teamId,
      token,
      ts: postTimestamp,
      dateString: rehearsal_date as string,
      channel: channel as string,
      roles: newRoles,
      blocks: blocks as string[],
      introText: introText as string
    })
  } catch (err) {
    console.error(err)
  }
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
  introText,
  roles
}: {
  songs: SongData
  blocks: string[]
  introText: string
  roles: { [role: string]: string }
}): Array<SectionBlock | ActionsBlock> {
  return [
    introductionBlock(introText),
    ...blocks
      .map((blockName) => {
        const block = AttendanceBlocks[blockName]
        return typeof block === 'function'
          ? block({ ...songs, ...roles })
          : block
      })
      .flat()
      .filter((block) => block != null)
  ]
}
