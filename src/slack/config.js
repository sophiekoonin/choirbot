const slack = require('slack')
const fetch = require('node-fetch')

const { getDbOrConfigValues } = require('../utils')
const { Actions } = require('./constants')
const { getToken } = require('./auth')

exports.onSlackInstall = async ({ token, userId }) => {
  await slack.chat.postMessage({
    token,
    channel: userId,
    as_user: true,
    username: 'SHE Bot',
    text: 'Welcome to the SHE Bot!'
  })
  await configureRehearsalDay({ token, userId })
}

const configureRehearsalDay = async ({ token, userId }) =>
  await slack.chat.postMessage({
    token,
    channel: userId,
    as_user: true,
    username: 'SHE Bot',
    text: 'Which day do you rehearse?',
    blocks: rehearsalDayBlocks
  })

exports.startConfigFlow = async function(teamId) {
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

const rehearsalDayBlocks = [
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

const yesNoRehearsalRemindersBlocks = selectedOptionText => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Your attendance posts will have the emoji :${selectedOptionText}:!`
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

const postToResponseUrl = async (responseUrl, body) => {
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

exports.respondToRehearsalDaySelected = async ({
  responseUrl,
  selectedOptionText
}) => {
  const body = {
    replace_original: true,
    blocks: yesNoRehearsalRemindersBlocks(selectedOptionText)
  }

  postToResponseUrl(responseUrl, body)
}

exports.respondToYesNoRehearsalReminders = ({
  responseUrl,
  selectedOption
}) => {
  const wantsRehearsalReminders = selectedOption === 'true' ? true : false
  const body = { replace_original: true }
  if (wantsRehearsalReminders) {
    const text =
      "I'll post rehearsal reminders! But first, I'll need the ID of your Google Sheet." +
      '\nYou can find it by getting the URL of your sheet and copying the string of letters and numbers that comes *after /d/* at the end of the URL.' +
      '\nThen, send me a message with the word `sheet` and the ID . \nFor example, `sheet 1ASGA89789GD0Qg7U5URu4gssyJwiw_DSGJ35ssfF`.' +
      "\n\nDon't have a schedule in Google Sheets? <https://docs.google.com/spreadsheets/d/1ngSxEdAuhdJTEb_pFE5nq1avNjzEjdMY8r-Z1QQL-v0/edit#gid=0|Here's the template>" +
      ' - you can go to `File > Make a copy` to get your own.'

    body.text = text
    return postToResponseUrl(responseUrl, body)
  }

  const text =
    "No problem, I won't post any rehearsal reminders. You're all set! :+1:"
  body.text = text
  body.response_type = 'ephemeral'
  return postToResponseUrl(responseUrl, body)
}
