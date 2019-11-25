import { WebAPICallResult, Block } from '@slack/web-api'

export interface SlackAPIArgs {
  channel: string
  token: string
  teamId: string
}

export interface PostAttendanceMessageArgs extends SlackAPIArgs {
  date: string
}

export interface ChatPostMessageResult extends WebAPICallResult {
  channel: string
  ts: string
  message: {
    text: string
  }
}

export interface SlackUser {
  id: UserId
  team_id: TeamId
  name: string
  deleted?: boolean
  real_name: string
  profile: {
    display_name: string
    email: string
  }
  is_admin: boolean
  is_owner: boolean
  is_bot: boolean
}
export interface ListUsersResult extends WebAPICallResult {
  members: Array<SlackUser>
}
interface ReactionResult {
  count: number
  name: string
  users: Array<string>
}
export interface MessageReactionsResult extends WebAPICallResult {
  message: {
    reactions: Array<ReactionResult>
    timestamp: number
  }
}

export interface ActionResponseBody {
  text: string
  replace_original?: boolean
  delete_original?: boolean
  response_type?: string
  blocks?: Array<Block>
}

export type UserId = string

export type TeamId = string
export interface RehearsalAttendanceData {
  attending: Array<UserId>
  notAttending: Array<UserId>
  date: string
}

export interface AttendanceData {
  [date: string]: string
}

export interface SingleUserAttendance {
  name: string
  attendance: AttendanceData
}
