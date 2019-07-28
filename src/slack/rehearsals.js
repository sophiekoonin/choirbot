const slack = require('slack')
const google = require('../google/google')

function getRehearsalMusicMessage(
  { mainSong, mainSongLink, runThrough, runThroughLink, notes },
  dayOfWeek
) {
  return `<!channel> Here's the plan for ${dayOfWeek}'s rehearsal! \n
  ${notes && notes !== '' ? `${notes}\n` : ''}
  We'll be doing ${mainSong} - ${mainSongLink ||
    "I can't find a link for this - please check the Arrangements Folder!"} \n
  *Run through*: ${
    runThrough ? runThrough : 'Please check the schedule for more info.'
  } ${runThroughLink ? ' - ' + runThroughLink : ''} \n
  Please give the recordings a listen! :sparkles:`
}

exports.postRehearsalMusic = async function({
  channel,
  teamId,
  token,
  dayOfWeek,
  date,
  isBankHoliday
}) {
  try {
    let text
    if (isBankHoliday) {
      text = `<!channel> It's a bank holiday next ${dayOfWeek}, so no rehearsal! Have a lovely day off!`
    } else {
      const nextWeekSongs = await google.getNextSongs(date)
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

    await slack.chat.postMessage({
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
