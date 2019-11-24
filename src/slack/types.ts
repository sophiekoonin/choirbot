import { WebAPICallResult } from '@slack/web-api';

export interface PostAttendanceMessageArgs {
  channel: string,
  token: string,
  teamId: string, 
  date: string
}

export interface ChatPostMessageResult extends WebAPICallResult {
  channel: string;
  ts: string;
  message: {
    text: string;
  }
}

interface ReactionResult {
  count: number,
  name: string,
  users: Array<string>
}
export interface MessageReactionsResult extends WebAPICallResult {
    message: {
        reactions: Array<ReactionResult>
        timestamp: number,
    },
}