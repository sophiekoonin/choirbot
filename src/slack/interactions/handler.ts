import { Request, Response } from 'express'

import { InboundInteraction } from '../types'
import { getConfigSubmissionValues } from './helpers'
import { Actions, Interactions } from '../constants'
import { getValue, getValues, updateDbValue } from '../../db'
import {
  handleFacilitatorDeclined,
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
  if (process.env.DEBUG) {
    console.log('Received interaction', JSON.stringify(payload, null, 3))
  }
  const { actions, team, trigger_id, view, type, user, message, channel } =
    payload
  let channelId = channel?.id
  const { root } = message || {}
  const { access_token, channel_id } = await getValues('teams', team.id, [
    'access_token',
    'channel_id'
  ])
  res.send()
  if (view != null && type === Interactions.VIEW_SUBMISSION) {
    const valuesToUpdate = getConfigSubmissionValues(view.state.values)
    await updateDbValue('teams', team.id, valuesToUpdate)
  }

  const token = access_token as string
  if (channel == null) {
    channelId = channel_id as string
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
        case Actions.FACILITATOR_ROULETTE:
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
        case Actions.DECLINE_FACILITATOR:
        case Actions.RUN_FACILITATOR_ROULETTE:
          await handleFacilitatorDeclined(
            team.id,
            token,
            channelId,
            root?.user,
            root?.ts
          )
        default:
          break
      }
    } catch (err) {
      console.error(err)
    }
  }

  showAppHome({ user: user.id, team: team.id })
}
