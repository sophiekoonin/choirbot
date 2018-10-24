const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// eslint-disable-next-line
Date.prototype.format = function() {
  return `${this.getDate()}/${this.getMonth() + 1}/${this.getFullYear()}`;
};

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

    const token = admin
      .firestore()
      .collection('tokens')
      .doc('token')
      .get()
      .then(doc => {
        if (!doc.exists) {
          console.log('Token not found!');
          return null;
        } else {
          return doc.data()['token'];
        }
      })
      .catch(err => console.error(err));
    fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        text: attendancePostContent,
        channel: 'C2Z635VUJ',
        icon_emoji: ':ballot_box_with_check:',
        as_user: false,
        username: 'Attendance Bot',
        attachments: [
          {
            callback_id: 'attendance_reply',
            actions: [
              {
                name: 'attending',
                text: ':+1:',
                type: 'button',
                value: 'pressed'
              },
              {
                name: 'notAttending',
                text: ':-1:',
                type: 'button',
                value: 'pressed'
              },
              {
                name: 'physical',
                text: ':muscle:',
                type: 'button',
                value: 'pressed'
              },
              {
                name: 'musical',
                text: ':musical_note:',
                type: 'button',
                value: 'pressed'
              },
              {
                name: 'facilitator',
                text: ':raised_hands:',
                type: 'button',
                value: 'pressed'
              }
            ]
          }
        ]
      })
    })
      .then(res => res.json())
      .then(json => {
        console.log(json);
        const { ts, channel } = json.message;
        return admin
          .firestore()
          .collection('attendance')
          .add({
            rehearsal_date: new Date().format(),
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
