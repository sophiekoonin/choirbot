const functions = require('firebase-functions');
const firebase = require('firebase');
const admin = require('firebase-admin');
const slack = require('slack');
const { flattenDeep } = require('lodash');

const google = require('./google');
const utils = require('./utils');

const { env } = functions.config().shebot;
const main = require('./index');

async function getAttendancePosts(team_id, limit) {
  const snapshot = await admin
    .firestore()
    .collection(`attendance-${team_id}`)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs;
}

async function getToken(team_id) {
  if (env === 'prod') {
    const doc = await admin
      .firestore()
      .collection('tokens')
      .doc(team_id)
      .get();
    if (!doc.exists) {
      throw new Error('Token not found');
    } else {
      return doc.get('token');
    }
  } else {
    return functions.config().slack.token;
  }
}

async function getSlackUsers(team_id) {
  const token = await getToken(team_id);
  const { members } = await slack.users.list({ token });
  return members
    .filter(member => !member.deleted)
    .filter(member => !member.is_bot)
    .map(member => member.id)
    .filter(id => id !== 'USLACKBOT');
}

exports.addAttendancePost = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    const { team_id, channel_id, text: message } = req.body;
    const token = await getToken(team_id);
    const nextWeekSongs = await google.getNextSongs();
    const text = utils.getAttendancePostMessage(nextWeekSongs, message);
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

      const rehearsal_date = new Date().format();
      if (env !== 'prod') {
        return { id: ts };
      }
      const result = await admin
        .firestore()
        .collection(`attendance-${team_id}`)
        .add({
          rehearsal_date: rehearsal_date,
          created_at: admin.firestore.Timestamp.now()._seconds,
          ts: ts,
          channel: channel,
          attending: [],
          notAttending: []
        });
      res.status(200).send(':+1:');
    } catch (err) {
      res.status(500).send('Oh no, something went wrong!');
      console.error(err);
    }
  });

exports.processAttendance = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    const { team_id } = req.body;
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
      await admin
        .firestore()
        .collection(`attendance-${team_id}`)
        .doc(id)
        .update({ attending, notAttending });
      res.status(200).send('Done!');
    } catch (err) {
      console.error(err);
      res.status(500).send(`Error: ${err}`);
    }
  });
/*
1. Fetch last 4 rehearsals
2. Filter list of users against attending/not attending 
3. Show who hasn't responded
 */
exports.reportAttendance = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    const { team_id } = req;
    const lastFourWeeks = await getAttendancePosts(team_id, 4);
    const allUsers = await getSlackUsers(team_id);
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
  });

exports.postRehearsalMusic = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    const { team_id, channel_id } = req.body;
    try {
      const nextWeekSongs = await google.getNextSongs();
      const token = await getToken(team_id);
      if (!nextWeekSongs || !nextWeekSongs.mainSong) {
        throw new Error(`Couldn't fetch next week's songs!`);
      }
      const text = utils.getRehearsalMusicMessage(nextWeekSongs);
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
  });
