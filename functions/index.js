const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

// eslint-disable-next-line
Date.prototype.format = function() {
  return `${this.getDate()}/${this.getMonth() + 1}/${this.getFullYear()}`;
};

exports.ping = functions.https.onRequest((request, response) => {
  response.send('SHE slash commands up and running! v0.1');
});

exports.addMessage = functions.https.onRequest((req, res) => {
  const original = req.query.text;
  return admin
    .firestore()
    .collection('test')
    .add({ original: original })
    .then(writeResult => {
      return res.json({ result: `Message with ID: ${writeResult.id} added.` });
    });
});

exports.addAttendancePost = functions.https.onRequest((req, res) => {
  const attendancePostContent =
    ':dancing_banana: Rehearsal day! :dancing_banana: <!channel> \n';
  ('Please indicate whether or not you can attend tonight by reacting to this message with :thumbsup:');
  ('(present) or :thumbsdown: (absent).\n');
  ('Facilitator please respond with :raised_hands:!\n');
  ('To volunteer for Physical warm up, respond with :muscle: ');
  ('For Musical warm up, respond with :musical_note:.');

  fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${functions.config().shebot.token}`
    },
    body: JSON.stringify({
      text: attendancePostContent,
      channel: 'C2Z635VUJ',
      icon_emoji: ':ballot_box_with_check:',
      as_user: false,
      username: 'Attendance Bot'
    })
  })
    .then(res => res.json())
    .then(({ message }) => {
      const { ts, channel } = message;
      return admin
        .firestore()
        .collection('attendance')
        .add({
          rehearsal_date: new Date(ts).format(),
          ts: ts,
          attending: [],
          notAttending: [],
          notResponded: []
        });
    })
    .catch(err => {
      throw new Error(err);
    });
  return res.send('Posting a message now!');
});
