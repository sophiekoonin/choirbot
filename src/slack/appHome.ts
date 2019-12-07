import { UserId, TeamId } from './types'
import { SlackClient } from './client'
import { getValue, getValues } from '../db'
import { View } from '@slack/types'
import { Actions, DaysOfWeek } from './constants'

export async function showAppHome({
  user,
  team
}: {
  user: UserId
  team: TeamId
}) {
  const token = await getValue('teams', team, 'bot_access_token')
  SlackClient.views.publish({
    token,
    user_id: user,
    view: await updateView(team)
  })
}

async function updateView(team: TeamId): Promise<View> {
  const [rehearsalDay, rehearsal_reminders] = await getValues('teams', team, [
    'rehearsal_day',
    'rehearsal_reminders'
  ])

  const blocks = [
    {
      // Section with text and a button
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          '*Welcome!* \nThis is where you can configure SHEbot to fit your choir.'
      }
    },
    // Horizontal divider line
    {
      type: 'divider'
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Choose your rehearsal day'
      },
      accessory: {
        action_id: Actions.SELECT_REHEARSAL_DAY,
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Select a day',
          emoji: true
        },
        initial_option: {
          text: {
            type: 'plain_text',
            text: DaysOfWeek[rehearsalDay],
            emoji: true
          },
          value: rehearsalDay
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
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Rehearsal reminders (4 days before rehearsal day)'
      },
      accessory: {
        type: 'radio_buttons',
        action_id: Actions.YES_NO_REMINDERS,
        initial_option: {
          value: rehearsal_reminders.toString(),
          text: {
            type: 'plain_text',
            text: rehearsal_reminders ? 'Enabled' : 'Disabled'
          }
        },
        options: [
          {
            value: 'true',
            text: {
              type: 'plain_text',
              text: 'Enabled'
            }
          },
          {
            value: 'false',
            text: {
              type: 'plain_text',
              text: 'Disabled'
            }
          }
        ]
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Set the ID of your spreadsheet Google Sheet'
      },
      accessory: {
        type: 'button',
        action_id: Actions.SHOW_SHEET_MODAL,
        text: {
          type: 'plain_text',
          text: 'Click to set',
          emoji: true
        },
        value: 'click_me_123'
      }
    }
  ]

  return {
    type: 'home',
    title: {
      type: 'plain_text',
      text: 'SHEBot configuration'
    },
    blocks: blocks
  }
}
