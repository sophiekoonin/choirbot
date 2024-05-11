import { SectionBlock } from '@slack/web-api'
import {
  mainSongBlock,
  notesBlock,
  runThroughBlock
} from '../slack/blocks/attendance'
import { SongData } from '../google/types'
import { format, nextDay, Day } from 'date-fns'
import { isBankHoliday } from '../utils'

export function getRehearsalMusicBlocks(
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

export async function getRehearsalDateFromToday(rehearsalDay: string) {
  const today = new Date()
  const date = nextDay(today, parseInt(rehearsalDay) as Day)
  return {
    date,
    dayOfWeek: format(date, 'eeee'),
    dateString: format(date, 'dd/MM/yyyy'),
    isBankHoliday: await isBankHoliday(format(date, 'yyyy-MM-dd'))
  }
}
