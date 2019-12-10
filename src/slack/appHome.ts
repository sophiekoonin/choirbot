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
        text: 'Configure SHEbot to work with your schedule spreadsheet'
      },
      accessory: {
        type: 'button',
        action_id: Actions.SHOW_SHEET_MODAL,
        text: {
          type: 'plain_text',
          text: 'Click to set',
          emoji: true
        }
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Configure what your attendance posts will look like'
      },
      accessory: {
        type: 'button',
        action_id: Actions.SET_ATTENDANCE_BLOCKS,
        text: {
          type: 'plain_text',
          text: 'Click to configure',
          emoji: true
        }
      }
    },
    {
      type: 'divider'
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          "*Manually post messages*\nIn case the message didn't automatically post for any reason."
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Post an attendance message*'
      },
      accessory: {
        type: 'button',
        action_id: Actions.POST_ATTENDANCE_MESSAGE,
        text: {
          type: 'plain_text',
          text: 'Post message',
          emoji: true
        },
        confirm: {
          title: {
            type: 'plain_text',
            text: 'Post attendance message'
          },
          text: {
            type: 'plain_text',
            text: 'Are you sure you want to post an attendance message?'
          },
          confirm: {
            type: 'plain_text',
            text: 'Post message'
          },
          deny: {
            type: 'plain_text',
            text: 'Cancel'
          }
        }
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Post a rehearsal reminder message*'
      },
      accessory: {
        type: 'button',
        action_id: Actions.POST_REHEARSAL_MESSAGE,
        text: {
          type: 'plain_text',
          text: 'Post message',
          emoji: true
        },
        confirm: {
          title: {
            type: 'plain_text',
            text: 'Post rehearsal message'
          },
          text: {
            type: 'plain_text',
            text: 'Are you sure you want to post a rehearsal reminder message?'
          },
          confirm: {
            type: 'plain_text',
            text: 'Post message'
          },
          deny: {
            type: 'plain_text',
            text: 'Cancel'
          }
        }
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
