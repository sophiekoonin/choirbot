import * as db from '../db'
import {
  respondToRehearsalDaySelected,
  respondToYesNoRehearsalReminders
} from './config'
import { Actions, ActionTypes } from './constants'

export const handleInteractions = async (req, res) => {
  const { payload } = req.body
  const { response_url, actions, team } = JSON.parse(payload)
  const action = actions[0]
  const { block_id, type } = action

  let value, text
  switch (type) {
    case ActionTypes.STATIC_SELECT:
      text = action.selected_option.text.text
      value = action.selected_option.value
      break
    case ActionTypes.BUTTON:
      text = action.text.text
      value = action.value
      break
  }

  db.updateDbValue('teams', team.id, { [block_id]: value })

  switch (block_id) {
    case Actions.SELECT_REHEARSAL_DAY:
      respondToRehearsalDaySelected({
        responseUrl: response_url,
        selectedOptionText: text
      })
      break
    case Actions.YES_NO_REMINDERS:
      respondToYesNoRehearsalReminders({
        responseUrl: response_url,
        selectedOption: value
      })
      break
    default:
      break
  }

  return res.sendStatus(200)
}

export const handleEvents = async (req, res) => {
  const { type } = req.body
  if (type === 'url_verification') {
    return res.send(req.body.challenge)
  }

  const { event } = req.body
  console.log({ event })
  return res.sendStatus(200)
}
