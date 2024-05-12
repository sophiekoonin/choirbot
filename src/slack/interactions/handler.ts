import { Request, Response } from 'express'

import { InboundInteraction } from '../types'
import { getConfigSubmissionValues } from './helpers'
import { Actions, Interactions } from '../constants'
import { getValue, updateDbValue } from '../../db'
import {
  postManually,
  setChannel,
  showGoogleSheetModal,
  showIgnoredUsersDialog,
  showReportDialog,
  showSetAttendanceBlocksDialog
} from './interactions'
import { updateAttendanceMessage } from '../../attendance'
import { updateRehearsalMessage } from '../../rehearsals'
import { showAppHome } from '../appHome'

export async function handleInteractions(
  req: Request,
  res: Response
): Promise<void> {
  const payload: InboundInteraction = JSON.parse(req.body.payload)
  const { actions, team, trigger_id, view, type, user } = payload
  const token = await getValue('teams', team.id, 'access_token')
  res.send()
  if (view != null && type === Interactions.VIEW_SUBMISSION) {
    const valuesToUpdate = getConfigSubmissionValues(view.state.values)
    await updateDbValue('teams', team.id, valuesToUpdate)
  }

  if (actions != null) {
    const action = actions[0]
    const { action_id } = action

    try {
      switch (action_id) {
        case Actions.POST_ATTENDANCE_MESSAGE:
          postManually({
            selectedOption: 'attendance',
            teamId: team.id
          })
          break
        case Actions.POST_REHEARSAL_MESSAGE:
          postManually({
            selectedOption: 'rehearsal',
            teamId: team.id
          })
          break
        case Actions.UPDATE_ATTENDANCE_MESSAGE:
          updateAttendanceMessage({ teamId: team.id, token })
          break
        case Actions.UPDATE_REHEARSAL_MESSAGE:
          updateRehearsalMessage({ teamId: team.id, token })
          break
        case Actions.SELECT_REHEARSAL_DAY:
          updateDbValue('teams', team.id, {
            [action_id]: action.selected_option.value
          })
          break
        case Actions.YES_NO_REMINDERS:
          updateDbValue('teams', team.id, {
            [action_id]: action.selected_option.value === 'true'
          })
          break
        case Actions.DISABLE_CHOIRBOT:
          updateDbValue('teams', team.id, {
            active: false
          })
          break
        case Actions.ENABLE_CHOIRBOT:
          updateDbValue('teams', team.id, {
            active: true
          })
          break
        case Actions.SET_CHANNEL:
          await setChannel(action, token, team.id)
          break
        case Actions.SHOW_SHEET_MODAL:
          showGoogleSheetModal(token, team.id, trigger_id)
          break
        case Actions.SET_ATTENDANCE_BLOCKS:
          await showSetAttendanceBlocksDialog(token, team.id, trigger_id)
          break
        case Actions.VIEW_REPORT:
          await showReportDialog(token, team.id, trigger_id)
          break
        case Actions.SHOW_IGNORE_MODAL:
          await showIgnoredUsersDialog(token, team.id, trigger_id)
          break
        default:
          break
      }
    } catch (err) {
      console.error(err)
    }
  }

  showAppHome({ user: user.id, team: team.id })
}