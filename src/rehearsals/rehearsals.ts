import * as google from '../google/google'
import { SlackClient } from '../slack/client'
import { getValue, getValues } from '../db/helpers'
import { notesBlock, headerBlock } from '../slack/blocks/attendance'
import { getRehearsalDateFromToday, getRehearsalMusicBlocks } from './helpers'
import { Block } from '@slack/web-api'

export async function postRehearsalReminder({
  channel,
  teamId,
  token,
  dayOfWeek,
  date,
  isBankHoliday,
  existingPostTimestamp
}: {
  channel: string
  teamId: string
  token: string
  dayOfWeek: string
  date: string
  isBankHoliday: boolean
  existingPostTimestamp?: string
}): Promise<void> {
  try {
    let text = `:wave: Here's the plan for ${dayOfWeek}'s rehearsal!`
    let destination = channel
    const isNextWeek = ['Monday', 'Tuesday', 'Wednesday'].includes(dayOfWeek)
    let blocks: Block[]

    if (isBankHoliday) {
      text = `<!channel> It's a bank holiday next ${dayOfWeek}, so no rehearsal! Have a lovely day off!`
    } else {
      const nextWeekSongs = await google.getNextSongs(date, teamId)
      if (nextWeekSongs == null || !nextWeekSongs.mainSong) {
        text = `I tried to post a rehearsal reminder, but I couldn't find a row for ${date} in the schedule. Please make sure the dates are correct!`
        destination = await getValue('teams', teamId, 'user_id')
      } else if (nextWeekSongs.mainSong.match(/rehearsal cancelled/gi)) {
        text = `Rehearsal is cancelled ${isNextWeek ? 'next' : 'this'} week.`
        blocks = [
          headerBlock(
            `:information_source: Rehearsal ${
              isNextWeek ? 'next' : 'this'
            } week is cancelled`
          ),
          notesBlock({
            notes: '<!channel> ' + nextWeekSongs.notes,
            showEmoji: false
          })
        ]
      } else if (nextWeekSongs.mainSong.match(/no rehearsal/gi)) {
        text = `Reminder: there's no rehearsal ${
          isNextWeek ? 'next' : 'this'
        } week!`
        blocks = [
          headerBlock(
            `:information_source: Reminder: there's no rehearsal ${
              isNextWeek ? 'next' : 'this'
            } week!`
          ),
          notesBlock({
            notes:
              '<!channel> ' +
              (nextWeekSongs.notes ||
                `We're not meeting ${isNextWeek ? 'next' : 'this'} week.`),
            showEmoji: false
          })
        ]
      } else {
        blocks = getRehearsalMusicBlocks(nextWeekSongs, dayOfWeek).filter(
          (block) => block != null
        )
      }
    }
    if (existingPostTimestamp != null && destination === channel) {
      await SlackClient.chat.update({
        token,
        ts: existingPostTimestamp,
        channel: destination,
        text,
        blocks
      })
    } else {
      await SlackClient.chat.postMessage({
        token,
        text,
        channel: destination,
        blocks
      })
    }
  } catch (err) {
    console.error(`Error posting rehearsal message for team ${teamId}`, err)
    return
  }
}

export const updateRehearsalMessage = async ({
  token,
  teamId
}: {
  token: string
  teamId: string
}) => {
  const { channel_id: channel, rehearsal_day } = await getValues(
    'teams',
    teamId,
    ['channel_id', 'rehearsal_day']
  )

  const { dayOfWeek, dateString, isBankHoliday } =
    await getRehearsalDateFromToday(rehearsal_day as string)

  const conversationHistory = await SlackClient.conversations.history({
    channel: channel as string,
    token
  })
  // Conversations are in reverse-chron order, so we look through for the first one by the bot
  const rehearsalMessage = conversationHistory.messages.find(
    (message) =>
      message.app_id === process.env.SLACK_APP_ID &&
      !message.text.includes(`Here's the plan for ${dayOfWeek}'s rehearsal!`)
  )

  const timestamp = rehearsalMessage.ts
  try {
    await postRehearsalReminder({
      channel: channel as string,
      teamId,
      token,
      dayOfWeek,
      date: dateString,
      isBankHoliday,
      existingPostTimestamp: timestamp
    })
  } catch (error) {
    console.error(error)
  }
}
