const slack = require('slack');
const utils = require('../utils');

function getRehearsalMusicMessage({
  mainSong,
  mainSongLink,
  runThrough,
  runThroughLink,
  notes
}) {
  return `<!channel> Here's the plan for Monday's rehearsal! \n
  ${
    notes.toLowerCase().includes('team updates')
      ? 'Team updates meeting at 6:30! All welcome :tada:\n'
      : ''
  }
  We'll be doing ${mainSong} - ${mainSongLink ||
    "I can't find a link for this - please check the Arrangements Folder!"} \n
  *Run through*: ${
    runThrough ? runThrough : 'Please check the schedule for more info.'
  } ${runThroughLink ? ' - ' + runThroughLink : ''} \n
  Please give the recordings a listen! :sparkles:`;
}

exports.postRehearsalMusic = async function(req, res) {
  const { teamId } = req.query;
  const [channel_id, token] = await utils.getDbOrConfigValues('teams', teamId, [
    'channel_id',
    'token'
  ]);

  try {
    const nextMonday = utils.getNextMonday();
    let text;
    const isBankHoliday = await utils.isBankHoliday(nextMonday);
    if (isBankHoliday) {
      text =
        "<!channel> It's a bank holiday next Monday, so no rehearsal! Have a lovely day off!";
    } else {
      const nextWeekSongs = await google.getNextSongs(nextMonday);
      if (!nextWeekSongs || !nextWeekSongs.mainSong) {
        throw new Error(`Couldn't fetch next week's songs!`);
      } else if (
        nextWeekSongs.mainSong.toLowerCase().includes('no rehearsal')
      ) {
        text = "<!channel> Reminder: there's no rehearsal next week!";
      } else {
        text = getRehearsalMusicMessage(nextWeekSongs);
      }
    }

    await slack.chat.postMessage({
      token,
      text,
      username: 'Schedule Bot',
      as_user: false,
      channel: channel_id
    });
    res.status(200).send();
  } catch (err) {
    res.send('No song details available - please check the schedule!');
    throw new Error(err);
  }
};
