import * as google from '../google/google'
import { SongData } from '../google/types'
import { SlackClient } from './client'
import { getValue } from '../db'
import { SectionBlock } from '@slack/types'
import { mainSongBlock, runThroughBlock, notesBlock } from './blocks/attendance'

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
        text:
          ':musical_note: Please give the recordings a listen before rehearsal.'
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
  isBankHoliday
}: {
  channel: string
  teamId: string
  token: string
  dayOfWeek: string
  date: string
  isBankHoliday: boolean
}): Promise<void> {
  try {
    let text = `:wave: Here's the plan for ${dayOfWeek}'s rehearsal!`
    let destination = channel
    let as_user = false
    let blocks

    if (isBankHoliday) {
      text = `<!channel> It's a bank holiday next ${dayOfWeek}, so no rehearsal! Have a lovely day off!`
    } else {
      const nextWeekSongs = await google.getNextSongs(date, teamId)
      if (nextWeekSongs == null || !nextWeekSongs.mainSong) {
        text = `I tried to post a rehearsal reminder, but I couldn't find a row for ${date} in the schedule. Please make sure the dates are correct!`
        as_user = true
        destination = await getValue('teams', teamId, 'user_id')
      } else if (nextWeekSongs.mainSong.match(/no rehearsal/gi)) {
        text = "<!channel> Reminder: there's no rehearsal next week!"
      } else {
        blocks = getRehearsalMusicBlocks(nextWeekSongs, dayOfWeek).filter(
          block => block != null
        )
      }
    }

    await SlackClient.chat.postMessage({
      token,
      text,
      username: 'Schedule Bot',
      as_user,
      channel: destination,
      blocks
    })
  } catch (err) {
    console.error(teamId, err)
    return
  }
}
