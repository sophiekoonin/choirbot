import { getRehearsalDateFromToday, getRehearsalMusicBlocks } from './helpers'

jest.mock('../utils', () => ({
  isBankHoliday: jest.fn().mockReturnValue(false)
}))

describe('rehearsal helpers', () => {
  jest.useFakeTimers().setSystemTime(new Date('2024-05-06')) // Monday
  test('getRehearsalDateFromToday', async () => {
    expect(await getRehearsalDateFromToday('1')).toEqual({
      date: new Date('2024-05-13'),
      dayOfWeek: 'Monday',
      dateString: '13/05/2024',
      isBankHoliday: false
    })
    expect(await getRehearsalDateFromToday('2')).toEqual({
      date: new Date('2024-05-07'),
      dayOfWeek: 'Tuesday',
      dateString: '07/05/2024',
      isBankHoliday: false
    })
    expect(await getRehearsalDateFromToday('3')).toEqual({
      date: new Date('2024-05-08'),
      dayOfWeek: 'Wednesday',
      dateString: '08/05/2024',
      isBankHoliday: false
    })
    expect(await getRehearsalDateFromToday('4')).toEqual({
      date: new Date('2024-05-09'),
      dayOfWeek: 'Thursday',
      dateString: '09/05/2024',
      isBankHoliday: false
    })
    expect(await getRehearsalDateFromToday('5')).toEqual({
      date: new Date('2024-05-10'),
      dayOfWeek: 'Friday',
      dateString: '10/05/2024',
      isBankHoliday: false
    })
    expect(await getRehearsalDateFromToday('6')).toEqual({
      date: new Date('2024-05-11'),
      dayOfWeek: 'Saturday',
      dateString: '11/05/2024',
      isBankHoliday: false
    })
    expect(await getRehearsalDateFromToday('7')).toEqual({
      date: new Date('2024-05-12'),
      dayOfWeek: 'Sunday',
      dateString: '12/05/2024',
      isBankHoliday: false
    })
  })

  test('getRehearsalMusicBlocks', () => {
    const mainSongTitle = 'Main Song Title'
    const runThroughTitle = 'Run Through Title'
    const notes = 'Blah blah blah'
    const mainSongLink = 'main-song-link'
    const runThroughLink = 'run-through-link'
    const dayOfWeek = '1'
    const blocks = getRehearsalMusicBlocks(
      {
        mainSong: mainSongTitle,
        mainSongLink,
        runThrough: runThroughTitle,
        runThroughLink,
        notes,
        customColumnHeader: '',
        customColumnValue: ''
      },
      dayOfWeek
    )
    expect(blocks).toEqual([
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<!channel> Here's the plan for ${dayOfWeek}'s rehearsal!`
        }
      },
      {
        type: 'section',
        block_id: 'notes',
        text: {
          type: 'mrkdwn',
          text: `:information_source: ${notes}`
        }
      },
      {
        type: 'section',
        block_id: 'main_song',
        text: {
          type: 'mrkdwn',
          text: `*We're singing*: <${mainSongLink}|Main Song Title>`
        }
      },
      {
        type: 'section',
        block_id: 'run_through',
        text: {
          type: 'mrkdwn',
          text: `*Run through*: <${runThroughLink}|Run Through Title>`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':musical_note: Please give the recordings a listen before rehearsal.'
        }
      }
    ])
  })
})
