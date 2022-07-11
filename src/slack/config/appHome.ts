import { UserId, TeamId } from '../types'
import { SlackClient } from '../client'
import { getValue, getValues } from '../../db'
import { View } from '@slack/types'
import { Actions, DaysOfWeek } from '../constants'

export async function showAppHome({
  user,
  team
}: {
  user: UserId
  team: TeamId
}) {
  const token = await getValue('teams', team, 'access_token')
  SlackClient.views.publish({
    token,
    user_id: user,
    view: await updateView(team)
  })
}

async function updateView(team: TeamId): Promise<View> {
  const {
    active,
    rehearsal_day: rehearsalDay,
    rehearsal_reminders: remindersEnabled,
    channel,
    google_sheet_id: sheetId
  } = await getValues('teams', team, [
    'active',
    'rehearsal_day',
    'rehearsal_reminders',
    'channel',
    'google_sheet_id'
  ])
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Welcome to SHE Bot!*'
      }
    },
    {
      type: 'divider'
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:repeat: *Refresh most recent attendance post*\n\nYou can refresh the latest attendance post if you've changed your schedule.\n\nI won't notify your members, and the attendance responses won't change.\n\nDon't worry, if you click this by accident, nothing will happen!\n\n`
      },
      accessory: {
        type: 'button',
        action_id: Actions.UPDATE_ATTENDANCE_MESSAGE,
        text: {
          type: 'plain_text',
          text: 'Update post',
          emoji: true
        },
        confirm: {
          title: {
            type: 'plain_text',
            text: 'Update attendance message'
          },
          text: {
            type: 'plain_text',
            text: 'Are you sure you want to update the most recent attendance message?'
          },
          confirm: {
            type: 'plain_text',
            text: 'Update'
          },
          deny: {
            type: 'plain_text',
            text: 'Cancel'
          }
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
        text: ':hammer_and_wrench: *SHEBot configuration*\n\n'
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Rehearsal day*'
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
            text: DaysOfWeek[rehearsalDay as string],
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
        text: `*Channel for bot posts*\n${
          channel !== '' ? `Currently set to *${channel}*` : '*No channel set.*'
        }`
      },
      accessory: {
        type: 'multi_channels_select',
        action_id: Actions.SET_CHANNEL,
        placeholder: {
          type: 'plain_text',
          text: 'Select a channel'
        },
        max_selected_items: 1
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Rehearsal reminders* (4 days before rehearsal day)'
      },
      accessory: {
        type: 'radio_buttons',
        action_id: Actions.YES_NO_REMINDERS,
        initial_option: {
          value: remindersEnabled.toString(),
          text: {
            type: 'plain_text',
            text: remindersEnabled ? 'Enabled' : 'Disabled'
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
        text: `*Google Sheets ID for your schedule*\n${
          sheetId !== ''
            ? `Currently set to <https://docs.google.com/spreadsheets/d/${sheetId}|${sheetId}>`
            : '*No sheet ID set - posts will not work*'
        }`
      },
      accessory: {
        type: 'button',
        action_id: Actions.SHOW_SHEET_MODAL,
        text: {
          type: 'plain_text',
          text: 'Click to change',
          emoji: true
        }
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Configure what your attendance posts will look like*'
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
        text: ':chart_with_upwards_trend: *Attendance reports & statistics*\n\n'
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'View report for last four weeks of rehearsals'
      },
      accessory: {
        type: 'button',
        action_id: Actions.VIEW_REPORT,
        text: {
          type: 'plain_text',
          text: 'View report',
          emoji: true
        }
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: "Exclude members from the reports (e.g. if they're away)"
      },
      accessory: {
        type: 'button',
        action_id: Actions.SHOW_IGNORE_MODAL,
        text: {
          type: 'plain_text',
          text: 'Choose members',
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
        text: ":rotating_light: *Emergency toolkit*\nManually post messages in case the message didn't automatically post for any reason.\n\n"
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
    },
    {
      type: 'divider'
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `💤 *${active ? 'Disable' : 'Enable'} SHEBot*`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `SHEBot is currently ${active ? 'enabled' : 'disabled'}.`
      },
      accessory: {
        type: 'button',
        action_id: active ? Actions.DISABLE_SHEBOT : Actions.ENABLE_SHEBOT,
        text: {
          type: 'plain_text',
          text: `${active ? 'Disable' : 'Enable'}`,
          emoji: true
        },
        confirm: {
          title: {
            type: 'plain_text',
            text: `${active ? 'Disable' : 'Enable'} SHEBot`
          },
          text: {
            type: 'plain_text',
            text: `Are you sure you want to ${
              active ? 'disable' : 'enable'
            } SHEBot? You can ${
              active ? 'enable' : 'disable'
            } it again at any time - no data will be deleted.`
          },
          confirm: {
            type: 'plain_text',
            text: active ? 'Disable' : 'Enable'
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
    blocks: blocks
  }
}
