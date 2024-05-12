import { SectionBlock } from '@slack/web-api'
import { db } from '../db'
import { SongData } from '../google/types'
import { MessageReactionsResult, TeamId } from '../slack/types'
import { AttendanceBlocks, introductionBlock } from '../slack/blocks/messages'
import { SlackClient } from '../slack/client'

export async function getAttendancePosts(team_id: TeamId, limit?: number) {
  const result = db
    .collection(`attendance-${team_id}`)
    .orderBy('created_at', 'desc')

  if (limit != null) {
    const slice = await result.limit(limit).get()
    return slice.docs
  }

  const snapshot = await result.get()
  return snapshot.docs
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

export async function getMostRecentAttendancePost(teamId: string) {
  const docs = await getAttendancePosts(teamId, 1)
  return docs.length > 0 ? docs[0] : null
}

export async function getReactionsForPost(
  token: string,
  channel: string,
  timestamp: string
) {
  try {
    const response = (await SlackClient.reactions.get({
      token,
      timestamp,
      channel
    })) as MessageReactionsResult
    if (!response.ok) {
      throw new Error('Failed to fetch Slack reactions')
    }
    const { reactions } = response.message
    return reactions
  } catch (err) {
    console.error(err)
  }
}
