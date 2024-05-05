import * as google from '../google/google'
import { SongData } from '../google/types'
import { SlackClient } from './client'
import { getValue, getValues } from '../db/helpers'
import { SectionBlock } from '@slack/types'
import {
  mainSongBlock,
  runThroughBlock,
  notesBlock,
  headerBlock
} from './blocks/attendance'
import { addDays, format } from 'date-fns'
import * as utils from '../utils'

function getRehearsalMusicBlocks(
  { mainSong, mainSongLink, runThrough, runThroughLink, notes }: SongData,
  dayOfWeek: string
): SectionBlock[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<!channel> Here's the plan for ${dayOfWeek}'s rehearsal!`
      }
    },
    notesBlock({ notes }),
    mainSongBlock({ mainSong, mainSongLink }),
    runThroughBlock({ runThrough, runThroughLink }),
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':musical_note: Please give the recordings a listen before rehearsal.'
      }
    }
  ]
}

export async function postRehearsalMusic({
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
    let isNextWeek = ['Monday', 'Tuesday', 'Wednesday'].includes(dayOfWeek)
    let blocks

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
            `:information_source: <!channel> Rehearsal ${
              isNextWeek ? 'next' : 'this'
            } week is cancelled`
          ),
          notesBlock({
            notes: '<!channel> ' + nextWeekSongs.notes,
            showEmoji: false
          })
        ]
      } else if (nextWeekSongs.mainSong.match(/no rehearsal/gi)) {
        text = `<!channel> Reminder: there's no rehearsal ${
          isNextWeek ? 'next' : 'this'
        } week!`
        blocks = [
          headerBlock(
            `:information_source: Reminder: there's no rehearsal ${
              isNextWeek ? 'next' : 'this'
            } week!`
          ),
          notesBlock({
            notes: '<!channel> ' + nextWeekSongs.notes,
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

export async function getRehearsalDateFromToday(rehearsalDay: string) {
  const today = new Date()
  const todayDayNumber = today.getDay()
  const diff = parseInt(rehearsalDay) - todayDayNumber
  const date = addDays(today, diff)
  console.log({ rehearsalDay, todayDayNumber, diff })
  return {
    date,
    dayOfWeek: format(date, 'eeee'),
    dateString: format(date, 'dd/MM/yyyy'),
    isBankHoliday: await utils.isBankHoliday(format(date, 'yyyy-MM-dd'))
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
    await postRehearsalMusic({
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
