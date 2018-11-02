const functions = require('firebase-functions');
const firebase = require('firebase');
const admin = require('firebase-admin');
const slack = require('slack');

const google = require('./google');
const utils = require('./utils');

const { env, teamid } = functions.config().shebot;
const main = require('./index');

function getToken() {
  return env === 'prod'
    ? admin
        .firestore()
        .collection('tokens')
        .doc(teamid)
        .get()
        .then(doc => {
          if (!doc.exists) {
            throw new Error('Token not found');
          } else {
            return doc.get('token');
          }
        })
    : functions.config().slack.token;
}

exports.addAttendancePost = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    return getToken()
      .then(token => {
        const attendancePostContent =
          ':dancing_banana: Rehearsal day! :dancing_banana: <!channel> \n' +
          'Please indicate whether or not you can attend tonight by reacting to this message with :thumbsup:' +
          '(present) or :thumbsdown: (absent).\n' +
          'Facilitator please respond with :raised_hands:!\n' +
          'To volunteer for Physical warm up, respond with :muscle: ' +
          'For Musical warm up, respond with :musical_note:.';

        const { channel_id } = req.body;
        return slack.chat.postMessage({
          token,
          channel: channel_id,
          as_user: false,
          username: 'Attendance Bot',
          text: attendancePostContent
        });
      })
      .then(({ ts, channel }) => {
        return Promise.all([
          { ts, channel },
          slack.reactions.add({
            token,
            timestamp: ts,
            channel,
            name: 'thumbsdown'
          }),
          slack.reactions.add({
            token,
            timestamp: ts,
            channel,
            name: 'thumbsup'
          })
        ]);
      })
      .then(results => {
        const { ts, channel } = results[0];
        const rehearsal_date = new Date().format();
        if (env !== 'prod') {
          return { id: ts };
        }
        return admin
          .firestore()
          .collection('attendance')
          .add({
            rehearsal_date: rehearsal_date,
            created_at: admin.firestore.Timestamp.now()._seconds,
            ts: ts,
            channel: channel,
            attending: [],
            notAttending: [],
            notResponded: []
          });
      })
      .then(result =>
        res.send(`Message posted! Saved to datastore with ID ${result.id}.`)
      )
      .catch(err => {
        res.status(500).send('Oh no, something went wrong!');
        console.error(err);
      });
  });

exports.processAttendance = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    return admin
      .firestore()
      .collection('attendance')
      .orderBy('created_at', 'desc')
      .limit(1)
      .get()
      .then(results => results.docs[0])
      .then(doc =>
        Promise.all([
          getToken(),
          () => ({
            id: doc.id,
            ts: doc.get('ts'),
            channel: doc.get('channel')
          })
        ])
      )
      .then(([token, slackData]) =>
        Promise.all([
          (id: slackData.id),
          slack.reactions.get({
            token: token,
            timestamp: slackData.ts,
            channel: slackData.channel
          })
        ])
      )
      .then(results => console.log(results[1]))
      .then(_ => res.status(200).send('all good'))
      .catch(err => {
        console.error(err);
        res.status(500).send(`Error: ${err}`);
      });
  });

exports.postRehearsalMusic = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    return google
      .getNextSongs()
      .then(values =>
        Promise.all([
          getToken(),
          () => {
            if (!values || !values.mainSong) return null;
            return `<!channel> Here's the plan for Monday's rehearsal! \n
    We'll be doing ${values.mainSong} - ${values.mainSongLink ||
              "I can't find a link for this - please check the Arrangements Folder!"} \n
    *Run through*: ${
      values.runThrough
        ? values.runThrough
        : 'No information - please check schedule:'
    } - ${values.runThroughLink} \n
    Please make sure you've listened to the recordings! :sparkles:`;
          }
        ])
      )
      .then(([token, message]) => {
        if (message === null) {
          res.send('No song details available - please check the schedule!');
          throw new Error('No song details available!');
        }
        const { channel_id } = req.body;
        return slack.chat.postMessage({
          token,
          text,
          username,
          as_user: false,
          channel: channel_id
        });
      })
      .then(response => {
        res.send('Done!');
        return;
      })
      .catch(err => console.error(err));
  });
