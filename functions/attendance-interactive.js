const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const querystring = require('querystring');
const env = functions.config().shebot.env;

const valueToEmojiMapper = {
  attending: ':+1:',
  notAttending: ':-1:',
  facilitator: ':raised_hands:',
  musical: ':musical_note:',
  physical: ':muscle:'
};

function findField(fields, value) {
  const field = fields.find(field =>
    field.title.includes(valueToEmojiMapper[value])
  );
  return {
    indexOfField: fields.indexOf(field),
    field: field
  };
}

function getCount(title) {
  return parseInt(title.substring(title.length - 2));
}

function addUserToField(field, value, user) {
  if (field.value.includes(user)) {
    return removeUserFromField(field, value, user);
  }
  const newField = Object.assign({}, field);
  if (value === 'attending' || value === 'notAttending') {
    newField.title = newField.title.replace(
      `\`${getCount(field.title)}\``,
      `\`${getCount(field.title) + 1}\``
    );
  }
  newField.value = `${field.value} <@${user}>`;
  return newField;
}

function removeUserFromField(field, value, user) {
  const newField = Object.assign({}, field);
  if (value === 'attending' || value === 'notAttending') {
    newField.title = newField.title.replace(
      `\`${getCount(field.title)}\``,
      `\`${getCount(field.title) - 1}\``
    );
  }
  newField.value = field.value.replace(`<@${user}>`, '');
  return newField;
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
          mrkdwn_in: ['fields'],
          fields: [
            {
              title: `${valueToEmojiMapper['attending']} Attending: \`0\``,
              value: '',
              short: false
            },
            {
              title: `${
                valueToEmojiMapper['notAttending']
              } Not attending: \`0\``,
              value: '',
              short: false
            },
            {
              title: `${valueToEmojiMapper['facilitator']} Facilitator`,
              value: '',
              short: false
            },
            {
              title: `${valueToEmojiMapper['physical']} Physical warmup`,
              value: '',
              short: false
            },
            {
              title: `${valueToEmojiMapper['musical']} Musical warmup`,
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
              value: 'facilitator'
            },
            {
              name: 'option',
              text: valueToEmojiMapper['physical'],
              type: 'button',
              value: 'physical'
            },
            {
              name: 'option',
              text: valueToEmojiMapper['musical'],
              type: 'button',
              value: 'musical'
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
          doc.update({ [value]: admin.firestore.FieldValue.arrayUnion(userId) })
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
