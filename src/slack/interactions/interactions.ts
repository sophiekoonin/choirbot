import * as db from '../../db/helpers'

import {
  ActionResponseBody,
  ActionSubmission,
  ChannelInfoResponse,
  TeamId
} from '../types'
import { postAttendanceMessage } from '../../attendance/attendance'
import { postRehearsalMusic } from '..'
import { getRehearsalDateFromToday } from '../../rehearsals'
import { SlackClient } from '../client'
import { joinChannel, openModalView } from '../utils'
import {
  chooseAttendancePostBlocks,
  reportView,
  setIgnoredUsersView,
  setSheetIdView
} from '../appHome/views'

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

export async function setChannel(
  action: ActionSubmission,
  token: string,
  teamId: string
) {
  const id = action.selected_channels[0]
  const channelInfo = (await SlackClient.conversations.info({
    token,
    channel: id
  })) as ChannelInfoResponse
  if (channelInfo.ok) {
    db.updateDbValue('teams', teamId, {
      channel: channelInfo.channel.name,
      channel_id: id
    })
    await joinChannel(teamId, channelInfo.channel.id, token)
  }
}

export async function showSetAttendanceBlocksDialog(
  token: string,
  teamId: string,
  trigger_id: string
) {
  const view = await chooseAttendancePostBlocks(teamId)
  openModalView(view, token, teamId, trigger_id)
}

export async function showReportDialog(
  token: string,
  teamId: string,
  trigger_id: string
) {
  const repView = await reportView(teamId, token)
  openModalView(repView, token, teamId, trigger_id)
}

export async function showIgnoredUsersDialog(
  token: string,
  teamId: string,
  trigger_id: string
) {
  const view = await setIgnoredUsersView(teamId)
  openModalView(view, token, teamId, trigger_id)
}

export async function showGoogleSheetModal(
  token: string,
  teamId: string,
  trigger_id: string
) {
  openModalView(setSheetIdView, token, teamId, trigger_id)
}
