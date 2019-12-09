import {
  WebAPICallResult,
  Block,
  Action,
  Option,
  PlainTextElement
} from '@slack/web-api'
import { IncomingHttpHeaders } from 'http'

export interface SlackAPIArgs {
  channel: string
  token: string
  teamId: string
}
export interface VerificationHeaders extends IncomingHttpHeaders {
  'x-slack-signature': string
  'x-slack-request-timestamp': string
}

export interface PostAttendanceMessageArgs extends SlackAPIArgs {
  date: string
  introText: string
  blocks: string[]
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
export interface ReactionResult {
  count: number
  name: string
  users: Array<UserId>
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

export interface OAuthError {
  ok: boolean
  error: string
}
export interface OAuthResponse extends WebAPICallResult {
  team_id: TeamId
  team_name: string
  user_id: UserId
  access_token: string
  incoming_webhook: {
    url: string
    channel_id: string
    channel: string
    configuration_url: string
  }
  bot: {
    bot_user_id: UserId
    bot_access_token: string
  }
}

export interface Event {
  type: string
  event_ts: number
  // user
}
export interface EventResponse {
  token: string
  team_id: TeamId
  api_app_id: string
  event: Event
  type: string
  event_id: string
  event_time: number
}

export interface SubmissionValue {
  [action_id: string]: {
    type: string
    value?: string
    selected_options?: [Option]
  }
}

export interface SubmissionValues {
  [block_id: string]: SubmissionValue
}
export interface ViewSubmissionDetails {
  id: string
  team_id: TeamId
  type: string
  blocks: [Block]
  callback_id: string | null
  state: {
    values: SubmissionValues
  }
  hash: string
  clear_on_close: boolean
  notify_on_close: boolean
  root_view_id: string
  app_id: string
  bot_id: string
}

export interface ActionSubmission {
  action_id: string
  block_id: string
  text?: PlainTextElement
  value?: string
  options: [Option]
  selected_option: Option
  type: string
  action_ts: string
}
export interface InboundInteraction {
  type: string
  response_url?: string
  team: {
    id: TeamId
    domain: string
  }
  user: {
    id: UserId
    username: string
    name: string
    team_id: TeamId
  }
  api_app_id: string
  token: string
  container: {
    type: string
    view_id: string
  }
  trigger_id: string
  view: ViewSubmissionDetails | null
  actions?: [ActionSubmission]
}
