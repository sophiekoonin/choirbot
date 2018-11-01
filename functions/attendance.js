const functions = require('firebase-functions');
const firebase = require('firebase');
const admin = require('firebase-admin');
const querystring = require('querystring');
const slack = require('slack');
const env = functions.config().shebot.env;
const main = require('./index');

exports.addAttendancePost = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    const attendancePostContent =
      ':dancing_banana: Rehearsal day! :dancing_banana: <!channel> \n' +
      'Please indicate whether or not you can attend tonight by reacting to this message with :thumbsup:' +
      '(present) or :thumbsdown: (absent).\n' +
      'Facilitator please respond with :raised_hands:!\n' +
      'To volunteer for Physical warm up, respond with :muscle: ' +
      'For Musical warm up, respond with :musical_note:.';

    const { channel_id } = req.body;
    return main
      .getSlackToken()
      .then(token =>
        Promise.all([
          token,
          slack.chat.postMessage({
            token,
            channel: channel_id,
            as_user: false,
            username: 'Attendance Bot',
            text: attendancePostContent
          })
        ])
      )
      .then(results => {
        const token = results[0];
        const { ts, channel } = results[1];
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
        if (env !== 'prod') {
          return { id: ts };
        }
        return admin
          .firestore()
          .collection('attendance')
          .add({
            rehearsal_date: new Date().format(),
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
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
        throw new Error(err);
      });
  });

exports.processAttendance = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    return admin
      .firestore()
      .collection('attendance')
      .orderBy('created_at')
      .limit(1)
      .get()
      .then(results => results.docs[0])
      .then(doc => console.log(doc.data()))
      .then(_ => res.status(200).send('all good'))
      .catch(err => console.error(err));
  });
