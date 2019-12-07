import { View } from '@slack/types'
import { Actions } from './constants'

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
