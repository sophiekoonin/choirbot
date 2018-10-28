const functions = require('firebase-functions');
const fetch = require('node-fetch');
const querystring = require('querystring');
const moment = require('moment');

const utils = require('./utils');

exports.postRehearsalMusic = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    const { channel_id } = req.body;
    const nextMonday = utils.getNextMonday();
    const message = `Hello everyone! ${nextMonday}`;

    const options = utils.getTokenAndPostOptions();
    options.body = querystring.stringify({
      text: message,
      username: 'Scheduletron 3000',
      channel: channel_id
    });
    fetch('https://slack.com/api/chat.postMessage', options)
      .then(res => res.json())
      .then(json => {
        if (!json.ok) {
          console.error(json.error);
          res.send('Something went wrong :(');
        } else {
          res.send('Done!');
        }
        return;
      })
      .catch(err => console.error(err));
  });
