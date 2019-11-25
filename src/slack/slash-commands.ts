import * as db from '../db'
import { reportAttendance, getStats } from './reports'
import { startConfigFlow } from './config'
import { Request, Response } from 'express'
import { TeamId } from './types'

export const handleSlashCommands = async (req: Request, res: Response) => {
  const { text, team_id: teamId } = req.body
  const textAsArray = text.split(' ')
  const command = textAsArray[0]
  switch (command) {
    case 'report':
      return await sendReport(res, teamId)
    case 'stats':
      return await sendStats(res, teamId)
    case 'sheet':
      setGoogleSheetId(teamId, textAsArray[1])
      return res.send(
        `I've set your Google Sheets ID to \`${textAsArray[1]}\` - if that's not right, you can do this again to reset it.`
      )
    case 'config':
      res.send('SHEBot Configuration')
      startConfigFlow(teamId)
      break
    default:
      return res.send("Sorry, I didn't understand that!")
  }
}

async function setGoogleSheetId(teamId: TeamId, sheetId: string) {
  await db.updateDbValue('teams', teamId, { google_sheet_id: sheetId })
}

async function sendReport(res: Response, teamId: TeamId) {
  const report = await reportAttendance(teamId)
  res.send(report)
}

async function sendStats(res: Response, teamId: TeamId) {
  const statsMsg = await getStats(teamId)
  res.send(statsMsg)
}
