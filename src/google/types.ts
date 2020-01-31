import {
  JWT,
  Compute,
  UserRefreshClient,
  OAuth2Client
} from 'google-auth-library'
export interface SongData {
  mainSong: string
  mainSongLink: string
  runThrough: string
  runThroughLink: string
  notes: string
  customColumnHeader: string
  customColumnValue: string
}

export type GoogleAuth =
  | string
  | OAuth2Client
  | JWT
  | Compute
  | UserRefreshClient
