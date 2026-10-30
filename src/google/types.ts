import { google } from 'googleapis'
export interface SongData {
  mainSong: string
  mainSongLink: string
  runThrough: string
  runThroughLink: string
  notes: string
  customColumnHeader: string
  customColumnValue: string
}

export type GoogleAuth = Awaited<ReturnType<typeof google.auth.getClient>>
