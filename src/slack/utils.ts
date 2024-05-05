import { ListUsersResult, ReactionResult, UserId } from './types'
import { SlackClient } from './client'
import { getDbDoc, getValue } from '../db/helpers'

export async function getSlackUserIds(
  teamId: string,
  token: string
): Promise<Array<UserId>> {
  const ignoredUsers: UserId[] =
    (await getDbDoc('teams', teamId)).get('ignored_users') || []
  const { members } = (await SlackClient.users.list({
    token
  })) as ListUsersResult
  return members
    .filter(
      (member) =>
        !member.deleted &&
        !member.is_bot &&
        !ignoredUsers.includes(member.id) &&
        member.id !== 'USLACKBOT'
    )
    .map((member) => member.id)
}

export async function joinChannel(
  teamId: string,
  channel: string,
  token: string
) {
  try {
    await SlackClient.channels.join({
      token,
      name: channel
    })
  } catch (err) {
    const user_id = await getValue('teams', teamId, 'user_id')
    console.error('Error joining channel: ' + err)
    await SlackClient.chat.postMessage({
      token,
      channel: user_id,
      text: `Couldn't join the channel #${channel} - got the following error: ${err.message}`
    })
  }
}

export function getUserReactionsForEmoji({
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
