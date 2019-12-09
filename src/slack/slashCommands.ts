import * as db from '../db'
import { reportAttendance, getStats } from './reports'
import { Request, Response } from 'express'
import { TeamId } from './types'
import { Actions } from './constants'
import {
  postAttendanceMessageButton,
  postRehearsalMessageButton,
  cancelButton
} from './interactions/buttons'

export const handleSlashCommands = async (req: Request, res: Response) => {
  const { text, team_id: teamId } = req.body
  const textAsArray = text.split(' ')
  const command = textAsArray[0]
  switch (command) {
    case 'help':
      return await sendHelp(res)
    case 'report':
      return await sendReport(res, teamId)
    case 'stats':
      return await sendStats(res, teamId)
    case 'sheet':
      setGoogleSheetId(teamId, textAsArray[1])
      return res.send(
        `I've set your Google Sheets ID to \`${textAsArray[1]}\` - if that's not right, you can do this again to reset it.`
      )
    case 'post':
      return await triggerRehearsalPost(res, teamId)
    default:
      return res.send(
        "Sorry, I didn't understand that! Type `/shebot help` for a list of available commands."
      )
  }
}

async function sendHelp(res: Response) {
  const msg = `
  *SHEBot Slash Commands*\n
  Type \`/shebot\` followed by one of these commands.\n\n
  \`config\` - configure rehearsal day and rehearsal reminders\n
  \`post\` - manual failsafe to post attendance/rehearsal reminder messages\n
  \`report\` - see who hasn't responded to the bot for a while
  \`sheet <sheet ID>\` - set the Google Sheets ID for your schedule spreadsheet\n
  \`stats\` - see attendance statistics
  `
  res.send(msg)
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

async function triggerRehearsalPost(res: Response, teamId: TeamId) {
  const hasRehearsalReminders = await db.getValue(
    'teams',
    teamId,
    'rehearsal_reminders'
  )

  const elements = hasRehearsalReminders
    ? [postAttendanceMessageButton, postRehearsalMessageButton, cancelButton]
    : [postAttendanceMessageButton, cancelButton]

  const rehearsalPostFlow = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'What kind of message do you want me to post?'
        }
      },
      {
        type: 'actions',
        block_id: Actions.POST_CANCEL,
        elements
      }
    ]
  }
  res.setHeader('Content-Type', 'application/json')
  res.send(rehearsalPostFlow)
}
