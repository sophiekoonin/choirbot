import * as google from '../google/google'
import { SongData } from '../google/types'
import { SlackClient } from './client'

function getRehearsalMusicMessage(
  { mainSong, mainSongLink, runThrough, runThroughLink, notes }: SongData,
  dayOfWeek: string
): string {
  return `<!channel> Here's the plan for ${dayOfWeek}'s rehearsal! \n
  ${notes && notes !== '' ? `${notes}\n` : ''}
  We'll be doing ${mainSong} - ${mainSongLink ||
    "I can't find a link for this - please check the Arrangements Folder!"} \n
  *Run through*: ${
    runThrough ? runThrough : 'Please check the schedule for more info.'
  } ${runThroughLink ? ' - ' + runThroughLink : ''} \n
  Please give the recordings a listen! :sparkles:`
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
    let text
    if (isBankHoliday) {
      text = `<!channel> It's a bank holiday next ${dayOfWeek}, so no rehearsal! Have a lovely day off!`
    } else {
      const nextWeekSongs = await google.getNextSongs(date, teamId)
      if (!nextWeekSongs || !nextWeekSongs.mainSong) {
        throw new Error(
          `Couldn't fetch next week's songs! Next week's songs were missing`
        )
      } else if (
        nextWeekSongs.mainSong.toLowerCase().includes('no rehearsal')
      ) {
        text = "<!channel> Reminder: there's no rehearsal next week!"
      } else {
        text = getRehearsalMusicMessage(nextWeekSongs, dayOfWeek)
      }
    }

    await SlackClient.chat.postMessage({
      token,
      text,
      username: 'Schedule Bot',
      as_user: false,
      channel
    })
  } catch (err) {
    console.error(teamId, err)
  }
}
