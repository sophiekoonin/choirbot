import {
  JWT,
  Compute,
  UserRefreshClient,
  Impersonated,
  BaseExternalAccountClient
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
  | JWT
  | Compute
  | UserRefreshClient
  | BaseExternalAccountClient
  | Impersonated
