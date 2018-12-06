const functions = require('firebase-functions');
const firebase = require('firebase');
const admin = require('firebase-admin');
const slack = require('slack');
const { flattenDeep } = require('lodash');

const google = require('./google');
const utils = require('./utils');

const { env, teamid } = functions.config().shebot;
const main = require('./index');

async function getAttendancePosts(limit) {
  const { docs } = await admin
    .firestore()
    .collection('attendance')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .get();
  return docs;
}

async function getToken() {
  if (env === 'prod') {
    const doc = await admin
      .firestore()
      .collection('tokens')
      .doc(teamid)
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

async function getSlackUsers() {
  const token = await getToken();
  const { members } = await slack.users.list({ token });
  return members
    .filter(member => !member.deleted)
    .map(member => member.id)
    .filter(id => id !== 'USLACKBOT');
}

exports.addAttendancePost = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    const { team_id, channel_id } = req.body;
    const token = await getToken(team_id);

    const attendancePostContent =
      ':dancing_banana: Rehearsal day! :dancing_banana: <!channel> \n' +
      'Please indicate whether or not you can attend tonight by reacting to this message with :thumbsup: ' +
      '(present) or :thumbsdown: (absent).\n' +
      'Facilitator please respond with :raised_hands:!\n' +
      'To volunteer for Physical warm up, respond with :muscle: ' +
      'For Musical warm up, respond with :musical_note:.';
    try {
      const { ts, channel } = await slack.chat.postMessage({
        token,
        channel: channel_id,
        as_user: false,
        username: 'Attendance Bot',
        text: attendancePostContent
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
        .collection(`attendance/${team_id}`)
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
    const { docs } = await getAttendancePosts(1);
    const firstResult = docs[0];
    const token = await getToken(team_id);
    const reactionRequestBody = {
      id: doc.id,
      timestamp: doc.get('ts'),
      channel: doc.get('channel')
    };

    try {
      const response = await slack.reactions.get({
        token,
        timestamp,
        channel
      });
      if (!response.ok) {
        throw new Error('Something went wrong!');
      }
      const { reactions } = response.message;
      const attending =
        reactions.find(group => (group.name = '+1'))['users'] || [];
      const notAttending =
        reactions.find(group => (group.name = '-1'))['users'] || [];
      await admin
        .firestore()
        .collection('attendance')
        .doc(id)
        .update({ attending: attending, notAttending: notAttending });
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
    const lastFourWeeks = await getAttendancePosts(4);
    const allUsers = await getSlackUsers();
    const postData = posts.map(post => ({
      attending: post.get('attending'),
      notAttending: post.get('notAttending'),
      date: post.get('rehearsal_date')
    }));
    const responded = flattenDeep(
      postData.map(post => [post.attending, post.notAttending])
    );
    const notResponded = users.filter(user => !responded.includes(user));

    const data = {
      notResponded,
      posts: postData
    };

    await res.send(result);
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
      const text = `<!channel> Here's the plan for Monday's rehearsal! \n
      We'll be doing ${nextWeekSongs.mainSong} - ${nextWeekSongs.mainSongLink ||
        "I can't find a link for this - please check the Arrangements Folder!"} \n
      *Run through*: ${
        nextWeekSongs.runThrough
          ? nextWeekSongs.runThrough
          : 'No information - please check schedule:'
      } - ${nextWeekSongs.runThroughLink} \n
      Please make sure you've listened to the recordings! :sparkles:`;
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
