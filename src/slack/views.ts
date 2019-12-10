import { View } from '@slack/types'
import { Actions, AttendancePostSections, Blocks } from './constants'

export const setSheetIdView: View = {
  type: 'modal',
  title: {
    type: 'plain_text',
    text: 'Set schedule sheet ID'
  },
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          'SHEbot needs the ID of your schedule spreadsheet in order to post what songs are coming up. You can find it by getting the URL of your sheet and copying the string of letters and numbers that comes *after /d/* at the end of the URL.'
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          "Don't have a schedule in Google Sheets? <https://docs.google.com/spreadsheets/d/1ngSxEdAuhdJTEb_pFE5nq1avNjzEjdMY8r-Z1QQL-v0/edit#gid=0|Here's the template>. Make a copy, and make sure the sharing settings are set to 'Anyone can view' or 'Anyone can edit'."
      }
    },
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: `Press Close if you don't want to make any changes.`
      }
    },
    {
      type: 'input',
      label: {
        type: 'plain_text',
        text: 'Sheet ID'
      },
      element: {
        type: 'plain_text_input',
        action_id: Actions.SET_SHEET_ID,
        placeholder: {
          type: 'plain_text',
          text: 'Type in here'
        },
        multiline: false
      },
      optional: false
    }
  ],
  submit: {
    type: 'plain_text',
    text: 'Save'
  }
}

export const chooseAttendancePostBlocks: View = {
  type: 'modal',
  title: {
    type: 'plain_text',
    text: 'Attendance posts'
  },
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        verbatim: true,
        text:
          'This is where you can compose the parts of the message that will be sent on *the day of* your rehearsal.'
      }
    },
    {
      type: 'input',
      block_id: Blocks.INTRO_TEXT,
      label: {
        type: 'plain_text',
        text: 'Introduction - this bit will always come first.'
      },
      element: {
        type: 'plain_text_input',
        action_id: Blocks.INTRO_TEXT,
        placeholder: {
          type: 'plain_text',
          text: 'Rehearsal day!'
        },
        multiline: true
      },
      optional: false
    },
    {
      type: 'input',
      block_id: Blocks.ATTENDANCE_BLOCKS,
      label: {
        type: 'plain_text',
        text:
          "Choose the sections that come next in the order that you want them. Leave out any you don't want."
      },
      element: {
        type: 'multi_static_select',
        action_id: Blocks.ATTENDANCE_BLOCKS,
        placeholder: {
          type: 'plain_text',
          text: 'Please choose'
        },
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Notes'
            },
            value: AttendancePostSections.NOTES
          },
          {
            text: {
              type: 'plain_text',
              text: 'React with 👍👎 if attending/not attending',
              emoji: true
            },
            value: AttendancePostSections.ATTENDANCE_EMOJI
          },
          {
            text: {
              type: 'plain_text',
              text: 'Main song'
            },
            value: AttendancePostSections.MAIN_SONG
          },
          {
            text: {
              type: 'plain_text',
              text: 'Run through song'
            },
            value: AttendancePostSections.RUN_THROUGH
          },
          {
            text: {
              type: 'plain_text',
              emoji: true,
              text: 'Volunteer for physical warmup with 💪'
            },
            value: AttendancePostSections.PHYSICAL_WARMUP
          },
          {
            text: {
              type: 'plain_text',
              emoji: true,
              text: 'Volunteer for musical warmup with 🎵'
            },
            value: AttendancePostSections.MUSICAL_WARMUP
          },
          {
            text: {
              type: 'plain_text',
              emoji: true,
              text: 'Volunteer to facilitate with 🙌'
            },
            value: AttendancePostSections.FACILITATOR
          }
        ]
      }
    }
  ],
  submit: {
    type: 'plain_text',
    text: 'Save'
  }
}
