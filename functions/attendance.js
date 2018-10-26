const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const querystring = require('querystring');
const env = functions.config().shebot.env;

// eslint-disable-next-line
Date.prototype.format = function() {
  return `${this.getDate()}/${this.getMonth() + 1}/${this.getFullYear()}`;
};

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
  return parseInt(title.substring(title.length - 1));
}

function addUserToField(field, value, user) {
  const newField = Object.assign({}, field);
  if (value === 'attending') {
    newField.title = `${valueToEmojiMapper[value]} ${getCount(field.title) +
      1}`;
  }
  newField.value = `${field.value} <!${user}>`;
  return newField;
}

function removeUserFromField(fields, value, user) {
  const newField = Object.assign({}, field);
  newField.title = `${valueToEmojiMapper[value]} ${getCount(field.title) - 1}`;
  newField.value = field.value.replace(`<!${user}>`, '');
  return newField;
}

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
    console.log(payload);
    const parsedPayload = JSON.parse(payload);
    const { original_message, message_ts, user } = parsedPayload;
    const { value } = parsedPayload['actions'][0] || null;
    const { id } = user;
    const channel = payload.channel.id;
    if (env === 'prod' && ['attending', 'notAttending'].includes(value)) {
      admin.firestore
        .collection('attendance')
        .orderBy('created_at')
        .limit(1)
        .get()
        .then(results => results[0])
        .then(doc =>
          doc.update({ [value]: admin.firestore.FieldValue.arrayUnion(id) })
        )
        .catch(err => console.error(err));
    }
    const options = getTokenAndPostOptions();
    const { attachments } = original_message;
    const { fields } = attachments[0];
    const { field, indexOfField } = findField(fields, value);
    const updatedField =
      value !== 'notAttending'
        ? addUserToField(field, value, id)
        : removeUserFromField(field, value, id);
    fields[indexOfField] = updatedField;
    attachments.fields = fields;
    options.attachments = attachments;
    options.ts = message_ts;
    options.channel = channel;
    fetch('https://slack.com/api/chat.update', options);

    res.status(200).send();
  });

const foo = {
  original_message: {
    text: 'New comic book alert!',
    attachments: [
      {
        title: 'The Further Adventures of Slackbot',
        fields: [
          { title: 'Volume', value: '1', short: true },
          { title: 'Issue', value: '3', short: true }
        ],
        author_name: 'Stanford S. Strickland',
        author_icon:
          'https://api.slack.comhttps://a.slack-edge.com/bfaba/img/api/homepage_custom_integrations-2x.png',
        image_url: 'http://i.imgur.com/OJkaVOI.jpg?1'
      },
      {
        title: 'Synopsis',
        text:
          'After @episod pushed exciting changes to a devious new branch back in Issue 1, Slackbot notifies @don about an unexpected deploy...'
      },
      {
        fallback: 'Would you recommend it to customers?',
        title: 'Would you recommend it to customers?',
        callback_id: 'comic_1234_xyz',
        color: '#3AA3E3',
        attachment_type: 'default',
        actions: [
          {
            name: 'recommend',
            text: 'Recommend',
            type: 'button',
            value: 'recommend'
          },
          { name: 'no', text: 'No', type: 'button', value: 'bad' }
        ]
      }
    ]
  }
};
