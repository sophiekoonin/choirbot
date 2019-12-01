import { Request, Response } from 'express'
import moment from 'moment'
import fetch from 'node-fetch'

import * as db from '../../db'
import {
  respondToRehearsalDaySelected,
  respondToYesNoRehearsalReminders
} from '../config'
import { Actions, ActionTypes } from '../constants'
import { ActionResponseBody, TeamId } from '../types'
import { postAttendanceMessage } from '../attendance'
import { postRehearsalMusic } from '..'

export async function handleInteractions(
  req: Request,
  res: Response
): Promise<Response> {
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

  switch (block_id) {
    case Actions.POST_CANCEL:
      respondToManualPostOrCancel({
        responseUrl: response_url,
        selectedOption: value,
        teamId: team.id
      })
      break
    case Actions.SELECT_REHEARSAL_DAY:
      db.updateDbValue('teams', team.id, { [block_id]: value })
      respondToRehearsalDaySelected({
        responseUrl: response_url,
        selectedOptionText: text
      })
      break
    case Actions.YES_NO_REMINDERS:
      db.updateDbValue('teams', team.id, { [block_id]: value })
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

export async function postToResponseUrl(
  responseUrl: string,
  body: ActionResponseBody
) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf8'
    },
    body: JSON.stringify(body)
  }

  const res = await fetch(responseUrl, options)
  const resJson = await res.json()
  if (!resJson.ok) {
    console.error('error', { resJson })
  }
}

export async function respondToManualPostOrCancel({
  responseUrl,
  selectedOption,
  teamId
}: {
  responseUrl: string
  selectedOption: string
  teamId: TeamId
}) {
  if (selectedOption === 'cancel') {
    postToResponseUrl(responseUrl, {
      text: "OK, I won't post anything.",
      replace_original: true
    })
    return
  }
  const [token, channel] = await db.getValues('teams', teamId, [
    'bot_access_token',
    'channel_id'
  ])
  const date = moment()

  postToResponseUrl(responseUrl, {
    text: 'OK, posting now.',
    replace_original: true
  })

  switch (selectedOption) {
    case 'post_attendance':
      return await postAttendanceMessage({
        channel,
        token,
        teamId,
        date: date.format('DD/MM/YYYY')
      })
    case 'post_rehearsal':
      return postRehearsalMusic({
        token,
        channel,
        teamId,
        dayOfWeek: date.format('dddd'),
        date: date.format('DD/MM/YYYY'),
        isBankHoliday: false
      })
    default:
      return
  }
}
