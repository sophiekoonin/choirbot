import { TeamId, SlackUser, ListUsersResult, UserId } from './types'
import { SlackClient } from './client'

export async function getSlackUsers(token: string): Promise<Array<SlackUser>> {
  const { members } = (await SlackClient.users.list({
    token
  })) as ListUsersResult
  return members
    .filter(member => !member.deleted)
    .filter(member => !member.is_bot)
    .filter(member => member.id !== 'USLACKBOT')
}

export async function getSlackUserIds(token: string): Promise<Array<UserId>> {
  const { members } = (await SlackClient.users.list({
    token
  })) as ListUsersResult
  return members
    .filter(member => !member.deleted)
    .filter(member => !member.is_bot)
    .map(member => member.id)
    .filter(id => id !== 'USLACKBOT')
}
