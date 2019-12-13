import { View } from '@slack/types'
import { Actions, Blocks } from '../constants'
import { getValues } from '../../db'
import { TeamId } from '../types'
import { getAttendancePostBlocks } from '../attendance'
import { AttendanceBlockSelectors } from '../blocks/config'
import { Option } from '@slack/web-api'
import { getReportBlocks } from '../reports'
import { getSlackUsers } from '../utils'

const exampleSongData = {
  mainSong: 'Example Song',
  mainSongLink: 'https://www.example.com',
  runThrough: 'Example Song',
  runThroughLink: 'https://www.example.com',
  notes: 'Social after rehearsal!'
}

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
      block_id: Actions.GOOGLE_SHEET_ID,
      label: {
        type: 'plain_text',
        text: 'Sheet ID'
      },
      element: {
        type: 'plain_text_input',
        action_id: Actions.GOOGLE_SHEET_ID,
        placeholder: {
          type: 'plain_text',
          text: 'Paste in here'
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

export async function reportView(teamId: TeamId, token: string): Promise<View> {
  const reportBlocks = await getReportBlocks(teamId, token)
  return {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: 'Attendance report'
    },
    blocks: [...reportBlocks]
  }
}

export async function chooseAttendancePostBlocks(
  teamId: TeamId
): Promise<View> {
  const {
    attendance_blocks: currentBlocks,
    intro_text: introText
  } = await getValues('teams', teamId, ['attendance_blocks', 'intro_text'])
  return {
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
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "*Here's a preview of your current message:*"
        }
      },
      {
        type: 'divider'
      },
      ...getAttendancePostBlocks({
        songs: exampleSongData,
        blocks: currentBlocks as string[],
        introText: introText as string
      }),
      {
        type: 'divider'
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
          initial_value: introText as string
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
          options: AttendanceBlockSelectors,
          initial_options: (currentBlocks as string[])
            .map((block: string) =>
              AttendanceBlockSelectors.find(b => b.value === block)
            )
            .filter((block: Option) => block != null)
        }
      }
    ],
    submit: {
      type: 'plain_text',
      text: 'Save'
    }
  }
}
