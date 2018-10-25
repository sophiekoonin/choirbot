const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const querystring = require('querystring');

// eslint-disable-next-line
Date.prototype.format = function() {
  return `${this.getDate()}/${this.getMonth() + 1}/${this.getFullYear()}`;
};

exports.addAttendancePost = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    const env = functions.config().shebot.env;
    const attendancePostContent =
      ':dancing_banana: Rehearsal day! :dancing_banana: <!channel> \n' +
      'Please indicate whether or not you can attend tonight by reacting to this message with :thumbsup:' +
      '(present) or :thumbsdown: (absent).\n' +
      'Facilitator please respond with :raised_hands:!\n' +
      'To volunteer for Physical warm up, respond with :muscle: ' +
      'For Musical warm up, respond with :musical_note:.';

function getTokenAndPostOptions() {
    const token =
      env === 'prod'
        ? admin
            .firestore()
            .collection('tokens')
            .doc(team_id)
            .get()
            .then(doc => {
              if (!doc.exists) {
                throw new Error('Token not found');
              } else {
                return doc.get('token');
              }
            })
        : functions.config().slack.token;

  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${token}`
    }
  };
}

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

    const { team_id, channel_id } = req.body;

    const postData = {
      text: attendancePostContent,
      channel: channel_id,
      as_user: false,
      username: 'Attendance Bot',
      attachments: JSON.stringify([
        {
          fallback: 'Please react with emoji today',
          attachment_type: 'default',
          callback_id: 'attendance_reply',
          fields: [
            {
              title: `${valueToEmojiMapper['attending']} 0`,
              value: '',
              short: false
            },
            {
              title: `${valueToEmojiMapper['notAttending']} 0`,
              value: '',
              short: false
            },
            {
              title: `${valueToEmojiMapper['facilitator']}`,
              value: '',
              short: false
            },
            {
              title: `${valueToEmojiMapper['physical']}`,
              value: '',
              short: false
            },
            {
              title: `${valueToEmojiMapper['musical']}`,
              value: '',
              short: false
            }
          ],
          actions: [
            {
              name: 'option',
              text: valueToEmojiMapper['attending'],
              type: 'button',
              value: 'attending'
            },
            {
              name: 'option',
              text: valueToEmojiMapper['notAttending'],
              type: 'button',
              value: 'notAttending'
            },
            {
              name: 'option',
              text: valueToEmojiMapper['facilitator'],
              type: 'button',
              value: 'fac'
            },
            {
              name: 'option',
              text: valueToEmojiMapper['physical'],
              type: 'button',
              value: 'phys'
            },
            {
              name: 'option',
              text: valueToEmojiMapper['musical'],
              type: 'button',
              value: 'mus'
            }
          ]
        }
      ])
    };

    const options = getTokenAndPostOptions();
    options.body = querystring.stringify(postData);
    fetch('https://slack.com/api/chat.postMessage', options)
      .then(res => res.json())
      .then(json => {
        if (!json.ok) throw new Error(json.error);
        const { ts, channel } = json.message;
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
