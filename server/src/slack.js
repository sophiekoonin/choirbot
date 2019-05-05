const slack = require('slack');
const { flattenDeep } = require('lodash');
const Firestore = require('@google-cloud/firestore');
const moment = require('moment');

const google = require('./google');
const utils = require('./utils');
const db = require('./db');

const { NODE_ENV } = process.env;
const config = NODE_ENV === 'dev' ? require('../config.json') : {};

exports.getAttendancePosts = async function(team_id, limit) {
  const snapshot = await db
    .collection(`attendance-${team_id}`)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs;
};

async function getToken(team_id) {
  return await utils.getDbOrConfigValue('tokens', team_id, 'token');
}

async function getSlackUserIds(team_id) {
  const token = await getToken(team_id);
  const { members } = await slack.users.list({ token });
  return members
    .filter(member => !member.deleted)
    .filter(member => !member.is_bot)
    .map(member => member.id)
    .filter(id => id !== 'USLACKBOT');
}

exports.getSlackUsers = async function(team_id) {
  const token = await getToken(team_id);
  const { members } = await slack.users.list({ token });
  return members
    .filter(member => !member.deleted)
    .filter(member => !member.is_bot)
    .filter(member => member.id !== 'USLACKBOT');
};

exports.addAttendancePost = async function(req, res) {
  const today = utils.formatDateISO(new Date());
  const isBankHol = await utils.isBankHoliday(today);
  if (isBankHol) {
    res.status(200).send('Bank holiday - not posting');
    return;
  } else {
    const [team_id, channel_id] = await utils.getDbOrConfigValues(
      'config',
      'slack',
      ['team_id', 'channel_id']
    );
    const token = await getToken(team_id);
    const date = moment(today).format('DD/MM/YYYY');
    const songs = await google.getNextSongs(date);
    if (songs.mainSong.toLowerCase().includes('no rehearsal')) {
      res.status(200).send('No rehearsal - not posting');
      return;
    }
    const text = utils.getAttendancePostMessage(songs);
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
        const result = await db.collection(`attendance-${team_id}`).add({
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
  const team_id = await utils.getDbOrConfigValue('config', 'slack', 'team_id');
  const docs = await getAttendancePosts(team_id, 1);
  const firstResult = docs[0];
  const token = await getToken(team_id);
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
      reactions.find(group => (group.name = '+1'))['users'] || [];
    const notAttending =
      reactions.find(group => (group.name = '-1'))['users'] || [];
    const numAttending = attending.length;
    const numNotAttending = notAttending.length;
    await db
      .collection(`attendance-${team_id}`)
      .doc(id)
      .update({ attending, notAttending });

    res.status(200).send('Done!');
  } catch (err) {
    console.error(err);
    res.status(500).send(`Error: ${err}`);
  }
};
/*
1. Fetch last 4 rehearsals
2. Filter list of users against attending/not attending 
3. Show who hasn't responded
 */
exports.reportAttendance = async function(req, res) {
  const team_id = await utils.getDbOrConfigValue('config', 'slack', 'team_id');
  const lastFourWeeks = await getAttendancePosts(team_id, 4);
  const allUsers = await getSlackUserIds(team_id);
  const postData = lastFourWeeks.map(post => ({
    attending: post.get('attending'),
    notAttending: post.get('notAttending'),
    date: post.get('rehearsal_date')
  }));
  const responded = flattenDeep(
    postData.map(post => [post.attending, post.notAttending])
  );
  const notResponded = allUsers.filter(user => !responded.includes(user));
  await res.send(
    `Not responded: ${notResponded.map(uid => `<@${uid}>`).join(', ')}`
  );
};

exports.postRehearsalMusic = async function(req, res) {
  const [team_id, channel_id] = await utils.getDbOrConfigValues(
    'config',
    'slack',
    ['team_id', 'channel_id']
  );
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
        text = utils.getRehearsalMusicMessage(nextWeekSongs);
      }
    }

    const token = await getToken(team_id);

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

exports.testSlackIntegration = async function(req, res) {
  try {
    const [team_id, channel_id] = await utils.getDbOrConfigValues(
      'config',
      'slack',
      ['team_id', 'channel_id']
    );
    const token = await getToken(team_id);
    await slack.chat.postMessage({
      token,
      text: 'Test post, please ignore!',
      username: 'Attendance Bot Test',
      as_user: false,
      channel: channel_id
    });
    res.status(200).send();
  } catch (err) {
    console.log('Error trying to test slack:', err);
  }
};
