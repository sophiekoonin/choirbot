const functions = require('firebase-functions');
const fetch = require('node-fetch');
const querystring = require('querystring');
const moment = require('moment');

const google = require('./google');
const utils = require('./utils');
exports.postRehearsalMusic = functions
  .region('europe-west1')
  .https.onRequest((req, res) =>
    google
      .getNextSongs()
      .then(values => {
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
      })
      .then(message => {
        if (message === null) {
          res.send('No song details available - please check the schedule!');
          throw new Error('No song details available!');
        }
        const { channel_id } = req.body;
        const nextMonday = utils.getNextMonday();
        const options = utils.getTokenAndPostOptions();
        options.body = querystring.stringify({
          text: message,
          username: 'Scheduletron 3000',
          channel: channel_id
        });

        return fetch('https://slack.com/api/chat.postMessage', options);
      })
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
      .catch(err => console.error(err))
  );
