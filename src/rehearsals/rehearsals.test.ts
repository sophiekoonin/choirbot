import {
  testChannelId,
  testRehearsalDate,
  testRehearsalDateString,
  testSpreadsheetHeaders,
  testTeamData,
  testUserId
} from '../test/testData'

import { google } from 'googleapis'
import { SlackClient } from '../slack/client'
import { postRehearsalReminder, updateRehearsalMessage } from './rehearsals'
import { subDays } from 'date-fns'

jest.mock('googleapis')
jest.mock('../slack/client')
jest.mock('../db/db')
jest.mock('../utils', () => ({
  isBankHoliday: async () => false
}))

describe('postRehearsalReminder', () => {
  const token = testTeamData.token
  const channel = testChannelId
  const teamId = testTeamData.id

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rehearsal as usual', () => {
    test("Messages the person who installed if couldn't find a row in the spreadsheet", async () => {
      await postRehearsalReminder({
        channel,
        token,
        teamId,
        dayOfWeek: 'Monday',
        date: '01/01/2021',
        isBankHoliday: false
      })

      expect(SlackClient.chat.postMessage).toHaveBeenCalledWith({
        token,
        channel: testUserId,
        text: "I tried to post a rehearsal reminder, but I couldn't find a row for 01/01/2021 in the schedule. Please make sure the dates are correct!"
      })
    })

    test('Posts a reminder for the next rehearsal with the appropriate blocks successfully', async () => {
      await postRehearsalReminder({
        channel,
        token,
        teamId,
        dayOfWeek: 'Monday',
        date: testRehearsalDateString,
        isBankHoliday: false
      })

      expect(SlackClient.chat.postMessage).toHaveBeenCalledWith({
        token,
        channel: testChannelId,
        text: ":wave: Here's the plan for Monday's rehearsal!",
        blocks: [
          {
            type: 'section',
            text: {
              text: "<!channel> Here's the plan for Monday's rehearsal!",
              type: 'mrkdwn'
            }
          },
          {
            block_id: 'notes',
            text: {
              text: ':information_source: Blah blah blah',
              type: 'mrkdwn'
            },
            type: 'section'
          },
          {
            block_id: 'main_song',
            text: {
              text: "*We're singing*: <main-song-link|Main Song Title>",
              type: 'mrkdwn'
            },
            type: 'section'
          },
          {
            block_id: 'run_through',
            text: {
              text: '*Run through*: <run-through-link|Run Through Title>',
              type: 'mrkdwn'
            },
            type: 'section'
          },
          {
            text: {
              text: ':musical_note: Please give the recordings a listen before rehearsal.',
              type: 'mrkdwn'
            },
            type: 'section'
          }
        ]
      })
    })
  })

  describe("Main song cell contains 'rehearsal cancelled'", () => {
    test('Posts a message that rehearsal is cancelled this week if the rehearsal falls within the same week', async () => {
      // @ts-expect-error mock type
      google.setMockBatchGetReturnValue([
        {
          range: 'B1:I1',
          values: [testSpreadsheetHeaders]
        },
        {
          range: 'B4:I4',
          values: [
            'Rehearsal Cancelled',
            'Run Through Title',
            'Blah blah blah',
            'main-song-link',
            'run-through-link'
          ]
        }
      ])

      await postRehearsalReminder({
        channel,
        token,
        teamId,
        dayOfWeek: 'Thursday',
        date: testRehearsalDateString,
        isBankHoliday: false
      })

      expect(SlackClient.chat.postMessage).toHaveBeenCalledWith({
        token,
        channel: testChannelId,
        text: 'Rehearsal is cancelled this week.',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: ':information_source: Rehearsal this week is cancelled'
            }
          },
          {
            block_id: 'notes',
            text: {
              text: '<!channel> Blah blah blah',
              type: 'mrkdwn'
            },
            type: 'section'
          }
        ]
      })
    })

    test('Posts a message that rehearsal is cancelled NEXT week if the rehearsal falls in the following week', async () => {
      // @ts-expect-error mock type
      google.setMockBatchGetReturnValue([
        {
          range: 'B1:I1',
          values: [testSpreadsheetHeaders]
        },
        {
          range: 'B4:I4',
          values: [
            'Rehearsal Cancelled',
            'Run Through Title',
            'Blah blah blah',
            'main-song-link',
            'run-through-link'
          ]
        }
      ])

      await postRehearsalReminder({
        channel,
        token,
        teamId,
        dayOfWeek: 'Monday',
        date: testRehearsalDateString,
        isBankHoliday: false
      })

      expect(SlackClient.chat.postMessage).toHaveBeenCalledWith({
        token,
        channel: testChannelId,
        text: 'Rehearsal is cancelled next week.',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: ':information_source: Rehearsal next week is cancelled'
            }
          },
          {
            block_id: 'notes',
            text: {
              text: '<!channel> Blah blah blah',
              type: 'mrkdwn'
            },
            type: 'section'
          }
        ]
      })
    })
  })

  describe("Main song cell contains 'no rehearsal'", () => {
    test("Posts a message that there's no rehearsal this week if the rehearsal falls within the same week", async () => {
      // @ts-expect-error mock type
      google.setMockBatchGetReturnValue([
        {
          range: 'B1:I1',
          values: [testSpreadsheetHeaders]
        },
        {
          range: 'B4:I4',
          values: [
            'No Rehearsal',
            'Run Through Title',
            'Blah blah blah',
            'main-song-link',
            'run-through-link'
          ]
        }
      ])

      await postRehearsalReminder({
        channel,
        token,
        teamId,
        dayOfWeek: 'Thursday',
        date: testRehearsalDateString,
        isBankHoliday: false
      })

      expect(SlackClient.chat.postMessage).toHaveBeenCalledWith({
        token,
        channel: testChannelId,
        text: "Reminder: there's no rehearsal this week!",
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: ":information_source: Reminder: there's no rehearsal this week!"
            }
          },
          {
            block_id: 'notes',
            text: {
              text: '<!channel> Blah blah blah',
              type: 'mrkdwn'
            },
            type: 'section'
          }
        ]
      })
    })

    test("Posts a message that there's no rehearsal NEXT week if the rehearsal falls in the following week", async () => {
      // @ts-expect-error mock type
      google.setMockBatchGetReturnValue([
        {
          range: 'B1:I1',
          values: [testSpreadsheetHeaders]
        },
        {
          range: 'B4:I4',
          values: [
            'No Rehearsal',
            'Run Through Title',
            'Blah blah blah',
            'main-song-link',
            'run-through-link'
          ]
        }
      ])

      await postRehearsalReminder({
        channel,
        token,
        teamId,
        dayOfWeek: 'Monday',
        date: testRehearsalDateString,
        isBankHoliday: false
      })

      expect(SlackClient.chat.postMessage).toHaveBeenCalledWith({
        token,
        channel: testChannelId,
        text: "Reminder: there's no rehearsal next week!",
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: ":information_source: Reminder: there's no rehearsal next week!"
            }
          },
          {
            block_id: 'notes',
            text: {
              text: '<!channel> Blah blah blah',
              type: 'mrkdwn'
            },
            type: 'section'
          }
        ]
      })
    })

    test("Defaults to message if there's no notes", async () => {
      // @ts-expect-error mock type
      google.setMockBatchGetReturnValue([
        {
          range: 'B1:I1',
          values: [testSpreadsheetHeaders]
        },
        {
          range: 'B4:I4',
          values: [
            'No Rehearsal',
            'Run Through Title',
            undefined,
            undefined,
            undefined
          ]
        }
      ])

      await postRehearsalReminder({
        channel,
        token,
        teamId,
        dayOfWeek: 'Monday',
        date: testRehearsalDateString,
        isBankHoliday: false
      })

      expect(SlackClient.chat.postMessage).toHaveBeenCalledWith({
        token,
        channel: testChannelId,
        text: "Reminder: there's no rehearsal next week!",
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: ":information_source: Reminder: there's no rehearsal next week!"
            }
          },
          {
            block_id: 'notes',
            text: {
              text: "<!channel> We're not meeting next week.",
              type: 'mrkdwn'
            },
            type: 'section'
          }
        ]
      })
    })
  })

  describe('Bank holiday', () => {
    test('Posts a message that there is no rehearsal on a bank holiday', async () => {
      await postRehearsalReminder({
        channel,
        token,
        teamId,
        dayOfWeek: 'Monday',
        date: testRehearsalDateString,
        isBankHoliday: true
      })
      expect(SlackClient.chat.postMessage).toHaveBeenCalledWith({
        token,
        channel: testChannelId,
        text: "<!channel> It's a bank holiday next Monday, so no rehearsal! Have a lovely day off!"
      })
    })
  })

  describe('With existingPostTimestamp', () => {
    test('Updates an existing post successfully', async () => {
      const existingPostTimestamp = '12345'
      // @ts-expect-error mock type
      google.setMockBatchGetReturnValue([
        {
          range: 'B1:I1',
          values: [testSpreadsheetHeaders]
        },
        {
          range: 'B4:I4',
          values: [
            'Main Song Title',
            'Run Through Title',
            'Blah blah blah',
            'main-song-link',
            'run-through-link'
          ]
        }
      ])

      await postRehearsalReminder({
        channel,
        token,
        teamId,
        dayOfWeek: 'Monday',
        date: testRehearsalDateString,
        isBankHoliday: false,
        existingPostTimestamp
      })

      expect(SlackClient.chat.update).toHaveBeenCalledWith({
        token,
        ts: existingPostTimestamp,
        channel: testChannelId,
        text: ":wave: Here's the plan for Monday's rehearsal!",
        blocks: [
          {
            type: 'section',
            text: {
              text: "<!channel> Here's the plan for Monday's rehearsal!",
              type: 'mrkdwn'
            }
          },
          {
            block_id: 'notes',
            text: {
              text: ':information_source: Blah blah blah',
              type: 'mrkdwn'
            },
            type: 'section'
          },
          {
            block_id: 'main_song',
            text: {
              text: "*We're singing*: <main-song-link|Main Song Title>",
              type: 'mrkdwn'
            },
            type: 'section'
          },
          {
            block_id: 'run_through',
            text: {
              text: '*Run through*: <run-through-link|Run Through Title>',
              type: 'mrkdwn'
            },
            type: 'section'
          },
          {
            text: {
              text: ':musical_note: Please give the recordings a listen before rehearsal.',
              type: 'mrkdwn'
            },
            type: 'section'
          }
        ]
      })
    })
  })
})

describe('Updating an existing rehearsal post', () => {
  const token = testTeamData.token
  const teamId = testTeamData.id
  const existingPostTimestamp = '12345'
  process.env.SLACK_APP_ID = 'APP_ID'
  const fakeToday = subDays(testRehearsalDate, 4)
  jest.useFakeTimers().setSystemTime(fakeToday)
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("Lets the person who installed know if it can't find a post to update", async () => {
    // @ts-expect-error mock type
    SlackClient.conversations.history.mockResolvedValue({
      messages: [
        {
          app_id: 'APP_ID',
          text: `What's your favourite cheese?`,
          ts: '135363.63635'
        }
      ]
    })
    await updateRehearsalMessage({ token, teamId })
    expect(SlackClient.chat.postMessage).toHaveBeenCalledWith({
      token,
      channel: testUserId,
      text: "I tried to post a rehearsal reminder, but I couldn't find an existing rehearsal reminder post to update. Maybe try posting a new one."
    })
  })

  test("Updates an existing post successfully if it's found", async () => {
    // @ts-expect-error mock type
    google.setMockBatchGetReturnValue([
      {
        range: 'B1:I1',
        values: [testSpreadsheetHeaders]
      },
      {
        range: 'B4:I4',
        values: [
          'New song who dis',
          'Run Through Title',
          'Blah blah blah',
          'main-song-link',
          'run-through-link'
        ]
      }
    ])

    // @ts-expect-error mock type
    SlackClient.conversations.history.mockResolvedValue({
      messages: [
        {
          app_id: 'APP_ID',
          text: "Here's the plan for Monday's rehearsal!",
          ts: existingPostTimestamp
        },
        {
          app_id: 'APP_ID',
          text: "What's your favourite cheese?",
          ts: '135363.63635'
        }
      ]
    })
    await updateRehearsalMessage({ token, teamId })

    expect(SlackClient.chat.update).toHaveBeenCalledWith({
      token,
      ts: existingPostTimestamp,
      channel: testChannelId,
      text: ":wave: Here's the plan for Monday's rehearsal!",
      blocks: [
        {
          type: 'section',
          text: {
            text: "<!channel> Here's the plan for Monday's rehearsal!",
            type: 'mrkdwn'
          }
        },
        {
          block_id: 'notes',
          text: {
            text: ':information_source: Blah blah blah',
            type: 'mrkdwn'
          },
          type: 'section'
        },
        {
          block_id: 'main_song',
          text: {
            text: "*We're singing*: <main-song-link|New song who dis>",
            type: 'mrkdwn'
          },
          type: 'section'
        },
        {
          block_id: 'run_through',
          text: {
            text: '*Run through*: <run-through-link|Run Through Title>',
            type: 'mrkdwn'
          },
          type: 'section'
        },
        {
          text: {
            text: ':musical_note: Please give the recordings a listen before rehearsal.',
            type: 'mrkdwn'
          },
          type: 'section'
        }
      ]
    })
  })
})
