const functions = require('firebase-functions');
const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
const admin = require('firebase-admin');
const moment = require('moment');
const utils = require('./utils');

const env = functions.config().shebot.env;
const sheetId = functions.config().google.sheet;
const sheets = google.sheets('v4');

const clientId = functions.config().google.id;
const clientSecret = functions.config().google.secret;
// WITH THANKS TO @elon.danziger: https://medium.com/@elon.danziger/fast-flexible-and-free-visualizing-newborn-health-data-with-firebase-nodejs-and-google-sheets-1f73465a18bc
const redirUrl = `https://us-central1-${
  process.env.GCLOUD_PROJECT
}.cloudfunctions.net/googleOauthRedirect`;

const functionsOauthClient = new OAuth2Client(clientId, clientSecret, redirUrl);

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
let oauthTokens = null;

function getAuthorizedClient() {
  return new Promise((resolve, reject) => {
    if (env !== 'prod') {
      oauthTokens = functions.config().google.oauth;
      functionsOauthClient.setCredentials(oauthTokens);
    }
    if (oauthTokens) {
      return resolve(functionsOauthClient);
    }
    admin.firestore
      .collection('tokens')
      .doc(clientId)
      .get()
      .then(doc => doc.data())
      .then(data => {
        oauthTokens = data;
        functionsOauthClient.setCredentials(data);
        return resolve(functionsOauthClient);
      })
      .catch(err => reject(err));
  });
}

function getValuesAndFlatten(response) {
  const { values } = response.data;
  return [].concat.apply([], values);
}
// visit the URL for this Function to obtain tokens
exports.authGoogleAPI = functions.https.onRequest((req, res) =>
  res.redirect(
    functionsOauthClient.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    })
  )
);

exports.googleOauthRedirect = functions.https.onRequest((req, res) => {
  const code = req.query.code;
  functionsOauthClient.getToken(code, (err, tokens) => {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (err) {
      return res.status(400).send(err);
    }
    return admin
      .firestore()
      .collection('tokens')
      .doc(clientId)
      .set({
        tokens
      })
      .then(() => res.status(200).send('OK'));
  });
});

function getRowNumber() {
  return new Promise((resolve, reject) => {
    return getAuthorizedClient()
      .then(client => {
        const request = {
          auth: client,
          spreadsheetId: sheetId,
          range: 'A:A'
        };
        return sheets.spreadsheets.values.get(request, (err, response) => {
          if (err) {
            console.log(`The API returned an error: ${err}`);
            return reject(err);
          }
          const rowNumber =
            getValuesAndFlatten(response).indexOf(utils.getNextMonday()) + 1;
          return resolve(rowNumber);
        });
      })
      .catch(err => reject(err));
  });
}

function getSongDetailsFromSheet(rowNumber) {
  return new Promise((resolve, reject) => {
    return getAuthorizedClient().then(client => {
      return sheets.spreadsheets.values.get(
        {
          auth: client,
          spreadsheetId: sheetId,
          range: `B${rowNumber}:I${rowNumber}`
        },
        (err, response) => {
          if (err) {
            console.log(`The API returned an error: ${err}`);
            return reject(err);
          }
          const values = getValuesAndFlatten(response);
          const mainSong = values[0];
          const runThrough = values[1];
          const mainSongLink = values[6];
          const runThroughLink =
            values[1] === '' || values[1] === null
              ? `https://docs.google.com/spreadsheets/d/${sheetId}`
              : values[7];
          return resolve({
            mainSong,
            mainSongLink,
            runThrough,
            runThroughLink
          });
        }
      );
    });
  });
}

exports.getNextSongs = function() {
  return getRowNumber()
    .then(rowNumber => getSongDetailsFromSheet(rowNumber))
    .then(res => res)
    .catch(err => new Error(err));
};
