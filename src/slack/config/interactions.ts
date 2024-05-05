import { Request, Response } from 'express'
import fetch from 'node-fetch'
import * as db from '../../db/helpers'

import { Actions, Interactions } from '../constants'
import {
  ActionResponseBody,
  TeamId,
  InboundInteraction,
  ChannelInfoResponse
} from '../types'
import { postAttendanceMessage, updateAttendanceMessage } from '../attendance'
import { postRehearsalMusic } from '..'
import { SlackClient } from '../client'
import {
  setSheetIdView,
  chooseAttendancePostBlocks,
  reportView,
  setIgnoredUsersView
} from './views'
import { processConfigSubmission } from './config'
import { joinChannel } from '../utils'
import { showAppHome } from './appHome'
import {
  getRehearsalDateFromToday,
  updateRehearsalMessage
} from '../rehearsals'

export async function handleInteractions(
  req: Request,
  res: Response
): Promise<void> {
  const payload: InboundInteraction = JSON.parse(req.body.payload)
  const { actions, team, trigger_id, view, type, user } = payload
  const token = await db.getValue('teams', team.id, 'access_token')
  res.send()

  if (view != null && type === Interactions.VIEW_SUBMISSION) {
    await processConfigSubmission({
      values: view.state.values,
      teamId: team.id
    })
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
          db.updateDbValue('teams', team.id, {
            [action_id]: action.selected_option.value
          })
          break
        case Actions.YES_NO_REMINDERS:
          db.updateDbValue('teams', team.id, {
            [action_id]: action.selected_option.value === 'true'
          })
          break
        case Actions.DISABLE_CHOIRBOT:
          db.updateDbValue('teams', team.id, {
            active: false
          })
          break
        case Actions.ENABLE_CHOIRBOT:
          db.updateDbValue('teams', team.id, {
            active: true
          })
          break
        case Actions.SET_CHANNEL:
          const id = action.selected_channels[0]
          const channelInfo = (await SlackClient.channels.info({
            token,
            channel: id
          })) as ChannelInfoResponse
          if (channelInfo.ok) {
            db.updateDbValue('teams', team.id, {
              channel: channelInfo.channel.name,
              channel_id: id
            })
            await joinChannel(team.id, channelInfo.channel.name, token)
          }
          break
        case Actions.SHOW_SHEET_MODAL:
          SlackClient.views
            .open({ view: setSheetIdView, token, trigger_id })
            .catch((err) =>
              console.error(`Error showing sheet ID modal for ${team.id}`, err)
            )

          break
        case Actions.SET_ATTENDANCE_BLOCKS:
          const view = await chooseAttendancePostBlocks(team.id)
          SlackClient.views
            .open({
              view,
              token,
              trigger_id
            })
            .catch((err) =>
              console.error(
                `Error showing attendance block for ${team.id}`,
                err
              )
            )
          break
        case Actions.VIEW_REPORT:
          const repView = await reportView(team.id, token)
          SlackClient.views
            .open({
              view: repView,
              token,
              trigger_id
            })
            .catch((err) =>
              console.error(`Error showing report modal for ${team.id}`, err)
            )
          break
        case Actions.SHOW_IGNORE_MODAL:
          const ignoreView = await setIgnoredUsersView(team.id, token)
          SlackClient.views
            .open({
              view: ignoreView,
              token,
              trigger_id
            })
            .catch((err) =>
              console.error(`Error showing ignore modal for ${team.id}`, err)
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

export async function postToResponseUrl(
  responseUrl: string,
  body?: ActionResponseBody
) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf8'
    },
    body: JSON.stringify(body)
  }

  const res = await fetch(responseUrl, options)
  if (!res.ok) {
    console.error('error', { body: res.body })
  }
}

export async function postManually({
  selectedOption,
  teamId
}: {
  selectedOption: string
  teamId: TeamId
}) {
  const {
    access_token: token,
    channel_id: channel,
    attendance_blocks: blocks,
    intro_text: introText,
    rehearsal_day: rehearsalDay
  } = await db.getValues('teams', teamId, [
    'access_token',
    'channel_id',
    'attendance_blocks',
    'intro_text',
    'rehearsal_day'
  ])
  let date = new Date()

  switch (selectedOption) {
    case 'attendance':
      return await postAttendanceMessage({
        channel: channel as string,
        token: token as string,
        teamId,
        blocks: blocks as string[],
        introText: introText as string,
        date
      })
    case 'rehearsal':
      const { dateString, dayOfWeek, isBankHoliday } =
        await getRehearsalDateFromToday(rehearsalDay as string)

      return postRehearsalMusic({
        token: token as string,
        channel: channel as string,
        teamId,
        dayOfWeek,
        date: dateString,
        isBankHoliday: false
      })
    default:
      return
  }
}
