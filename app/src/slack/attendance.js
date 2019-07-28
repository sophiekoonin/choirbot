const slack = require('slack');
const Firestore = require('@google-cloud/firestore');
const moment = require('moment');

const google = require('../google/google');
const utils = require('../utils');
const db = require('../db');
const { getToken } = require('./auth');

async function getAttendancePosts(team_id, limit) {
  const snapshot = await db.db
    .collection(`attendance-${team_id}`)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs;
}

exports.addAttendancePost = async function(req, res) {
  const today = utils.formatDateISO(new Date());
  const isBankHol = await utils.isBankHoliday(today);
  if (isBankHol) {
    res.status(200).send('Bank holiday - not posting');
    return;
  } else {
    const { teamId } = req.query;
    const [channel_id, token] = await utils.getDbOrConfigValues(
      'teams',
      teamId,
      ['channel_id', 'token']
    );

    const date = moment(today).format('DD/MM/YYYY');
    const songs = await google.getNextSongs(date);
    if (songs.mainSong.toLowerCase().includes('no rehearsal')) {
      res.status(200).send('No rehearsal - not posting');
      return;
    }
    const text = getAttendancePostMessage(songs);
    try {
      const { ts, channel } = await slack.chat.postMessage({
        token,
        channel: channel_id,
        as_user: false,
        username: 'Attendance Bot',
        text
      });

      await slack.reactions.add({
        token,
        timestamp: ts,
        channel,
        name: 'thumbsdown'
      });
      await slack.reactions.add({
        token,
        timestamp: ts,
        channel,
        name: 'thumbsup'
      });

      if (NODE_ENV === 'prod') {
        await db.setDbValue(`attendance-${team_id}`, rehearsal_date, {
          rehearsal_date: today,
          created_at: Firestore.Timestamp.now()._seconds,
          ts: ts,
          channel: channel,
          attending: [],
          notAttending: []
        });
      }

      res.status(200).send('Posted and stored in DB successfully!');
    } catch (err) {
      res.status(500).send('Oh no, something went wrong!');
      console.error(err);
    }
  }
};

exports.processAttendance = async function(req, res) {
  const { teamId } = req.query;
  const [channel_id, token] = await utils.getDbOrConfigValues('teams', teamId, [
    'channel_id',
    'token'
  ]);
  const docs = await getAttendancePosts(teamId, 1);
  const firstResult = docs[0];
  try {
    const response = await slack.reactions.get({
      token,
      timestamp: firstResult.get('ts'),
      channel: firstResult.get('channel')
    });
    if (!response.ok) {
      throw new Error('Something went wrong!');
    }
    const id = firstResult.id;
    const { reactions } = response.message;
    const attending =
      reactions.find(group => group.name === '+1')['users'] || [];
    const notAttending =
      reactions.find(group => group.name === '-1')['users'] || [];
    await db.updateDbValue(`attendance-${teamId}`, id, {
      attending,
      notAttending
    });

    res.status(200).send('Done!');
  } catch (err) {
    console.error(err);
    res.status(500).send(`Error: ${err}`);
  }
};

exports.getAttendancePosts = getAttendancePosts;

function getAttendancePostMessage({
  mainSong = 'please check schedule for details!',
  runThrough,
  notes
}) {
  return (
    ':dancing_banana: Rehearsal day! :dancing_banana: <!channel> \n' +
    `*Today's rehearsal:* ${mainSong}\n` +
    ` ${runThrough ? `*Run through:* ${runThrough}\n\n` : ''}` +
    ` ${
      notes.toLowerCase().includes('team updates')
        ? '*Team updates meeting at 6:30! All welcome* :tada:\n'
        : ''
    }` +
    'Please indicate whether or not you can attend tonight by reacting to this message with :thumbsup: ' +
    '(present) or :thumbsdown: (absent).\n' +
    'Facilitator please respond with :raised_hands:!\n' +
    'To volunteer for Physical warm up, respond with :muscle: ' +
    'For Musical warm up, respond with :musical_note:.'
  );
}
