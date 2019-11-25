import fetch from 'node-fetch'
import { getDbOrConfigValues } from '../utils'
import { Actions } from './constants'
import { SlackClient } from './client'
import { SectionBlock, ActionsBlock } from '@slack/types'
import { ActionResponseBody } from './types'

export async function onSlackInstall({
  token,
  userId
}: {
  token: string
  userId: string
}): Promise<void> {
  await SlackClient.chat.postMessage({
    token,
    channel: userId,
    as_user: true,
    username: 'SHE Bot',
    text: 'Welcome to the SHE Bot!'
  })
  await configureRehearsalDay({ token, userId })
}

async function configureRehearsalDay({
  token,
  userId
}: {
  token: string
  userId: string
}): Promise<void> {
  await SlackClient.chat.postMessage({
    token,
    channel: userId,
    as_user: true,
    username: 'SHE Bot',
    text: 'Which day do you rehearse?',
    blocks: rehearsalDayBlocks
  })
}

export async function startConfigFlow(teamId: string) {
  const [user_id, bot_access_token] = await getDbOrConfigValues(
    'teams',
    teamId,
    ['user_id', 'bot_access_token']
  )
  configureRehearsalDay({
    token: bot_access_token,
    userId: user_id
  })
  return
}

const rehearsalDayBlocks: Array<SectionBlock> = [
  {
    type: 'section',
    block_id: Actions.SELECT_REHEARSAL_DAY,
    text: {
      type: 'mrkdwn',
      text: 'Pick the day that you rehearse'
    },
    accessory: {
      action_id: Actions.SELECT_REHEARSAL_DAY,
      type: 'static_select',
      placeholder: {
        type: 'plain_text',
        text: 'Select an item',
        emoji: true
      },
      options: [
        {
          text: {
            type: 'plain_text',
            text: 'Monday',
            emoji: true
          },
          value: '1'
        },
        {
          text: {
            type: 'plain_text',
            text: 'Tuesday',
            emoji: true
          },
          value: '2'
        },
        {
          text: {
            type: 'plain_text',
            text: 'Wednesday',
            emoji: true
          },
          value: '3'
        },
        {
          text: {
            type: 'plain_text',
            text: 'Thursday',
            emoji: true
          },
          value: '4'
        },
        {
          text: {
            type: 'plain_text',
            text: 'Friday',
            emoji: true
          },
          value: '5'
        },
        {
          text: {
            type: 'plain_text',
            text: 'Saturday',
            emoji: true
          },
          value: '6'
        },
        {
          text: {
            type: 'plain_text',
            text: 'Sunday',
            emoji: true
          },
          value: '0'
        }
      ]
    }
  }
]

function yesNoRehearsalRemindersBlocks(
  selectedOptionText: string
): Array<SectionBlock | ActionsBlock> {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Attendance posts will be posted on ${selectedOptionText}s at 9:30am!`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          "Do you want to enable rehearsal reminders? You'll need a Google Sheet set up with your schedule."
      }
    },
    {
      type: 'actions',
      block_id: Actions.YES_NO_REMINDERS,
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Yes'
          },
          value: 'true'
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'No'
          },
          value: 'false'
        }
      ]
    }
  ]
}

async function postToResponseUrl(
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

export const respondToRehearsalDaySelected = async ({
  responseUrl,
  selectedOptionText
}: {
  responseUrl: string
  selectedOptionText: string
}) => {
  const body: ActionResponseBody = {
    text: 'Continue SHEbot setup!',
    replace_original: true,
    blocks: yesNoRehearsalRemindersBlocks(selectedOptionText)
  }

  postToResponseUrl(responseUrl, body)
}

export const respondToYesNoRehearsalReminders = ({
  responseUrl,
  selectedOption
}: {
  responseUrl: string
  selectedOption: string
}) => {
  const wantsRehearsalReminders = selectedOption === 'true' ? true : false
  if (wantsRehearsalReminders) {
    const text =
      "I'll post rehearsal reminders! But first, I'll need the ID of your Google Sheet." +
      '\nYou can find it by getting the URL of your sheet and copying the string of letters and numbers that comes *after /d/* at the end of the URL.' +
      '\nThen, send me a message with the word `sheet` and the ID . \nFor example, `sheet 1ASGA89789GD0Qg7U5URu4gssyJwiw_DSGJ35ssfF`.' +
      "\n\nDon't have a schedule in Google Sheets? <https://docs.google.com/spreadsheets/d/1ngSxEdAuhdJTEb_pFE5nq1avNjzEjdMY8r-Z1QQL-v0/edit#gid=0|Here's the template>" +
      ' - you can go to `File > Make a copy` to get your own.'

    const body: ActionResponseBody = { text, replace_original: true }
    return postToResponseUrl(responseUrl, body)
  }

  const text =
    "No problem, I won't post any rehearsal reminders. You're all set! :+1:"
  const body: ActionResponseBody = {
    replace_original: true,
    response_type: 'ephemeral',
    text
  }
  return postToResponseUrl(responseUrl, body)
}
