const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Slack = require('slack');
const querystring = require('querystring');
const { getSlackToken } = require('./utils');

const env = functions.config().shebot.env;
const slack = new Slack({ token: getSlackToken() });

const valueToEmojiMapper = {
  attending: ':+1:',
  notAttending: ':-1:',
  facilitator: ':raised_hands:',
  musical: ':musical_note:',
  physical: ':muscle:'
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

    const { channel_id } = req.body;
    return slack.chat
      .postMessage({
        channel: channel_id,
        as_user: false,
        username: 'Attendance Bot',
        text: attendancePostContent
      })
      .then(({ ts, channel }) =>
        Promise.all([
          ts,
          slack.reactions.add({ timestamp: ts, channel, name: 'thumbsup' }),
          slack.reactions.add({ timestamp: ts, channel, name: 'thumbsdown' })
        ])
      )
      .then(results => {
        const ts = results[0];
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

exports.registerAttendance = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    const { payload } = req.body;
    const parsedPayload = JSON.parse(payload);
    const { original_message, message_ts, user, channel } = parsedPayload;
    const { value } = parsedPayload['actions'][0] || null;
    const userId = user.id;
    const channelId = channel.id;
    if (env === 'prod' && ['attending', 'notAttending'].includes(value)) {
      admin.firestore
        .collection('attendance')
        .orderBy('created_at')
        .limit(1)
        .get()
        .then(results => results[0])
        .then(doc =>
          doc.update({
            [value]: admin.firestore.FieldValue.arrayUnion(userId)
          })
        )
        .catch(err => console.error(err));
    }
    const options = getTokenAndPostOptions();
    const { attachments } = original_message;
    const { fields } = attachments[0];
    const { field, indexOfField } = findField(fields, value);
    const updatedField = addUserToField(field, value, userId);
    fields[indexOfField] = updatedField;
    attachments.fields = fields;
    const body = {
      attachments: JSON.stringify(attachments),
      ts: message_ts,
      channel: channelId,
      link_names: true
    };
    options.body = querystring.stringify(body);
    fetch('https://slack.com/api/chat.update', options).catch(err => {
      throw new Error(err);
    });
    res.status(200).send();
  });
