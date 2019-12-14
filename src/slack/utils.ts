import { TeamId, SlackUser, ListUsersResult, UserId } from './types'
import { SlackClient } from './client'
import { getDbDoc } from '../db'

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
    .filter(member => !member.deleted)
    .filter(member => !member.is_bot)
    .map(member => member.id)
    .filter(id => !ignoredUsers.includes(id))
}
