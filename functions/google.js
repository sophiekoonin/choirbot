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

async function getAuthorizedClient() {
  if (env !== 'prod') {
    oauthTokens = functions.config().google.oauth;
    functionsOauthClient.setCredentials(oauthTokens);
  }
  if (oauthTokens) {
    return functionsOauthClient;
  }
  const doc = await admin.firestore
    .collection('tokens')
    .doc(clientId)
    .get();
  const data = doc.data();
  oauthTokens = data;
  functionsOauthClient.setCredentials(data);
  return functionsOauthClient;
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

exports.googleOauthRedirect = functions.https.onRequest(async (req, res) => {
  const code = req.query.code;
  await functionsOauthClient.getToken(code, async (err, tokens) => {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (err) {
      return res.status(400).send(err);
    }
    await admin
      .firestore()
      .collection('tokens')
      .doc(clientId)
      .set({
        tokens
      });
    res.status(200).send('OK');
  });
});

async function getRowNumber() {
  const client = await getAuthorizedClient();
  const request = {
    auth: client,
    spreadsheetId: sheetId,
    range: 'A:A'
  };
  try {
    const response = await sheets.spreadsheets.values.get(request);
    const rowNumber =
      getValuesAndFlatten(response).indexOf(utils.getNextMonday()) + 1;
    return rowNumber;
  } catch (err) {
    console.error(`Error getting row number: ${err}`);
    throw new Error(err);
  }
}

async function getSongDetailsFromSheet(rowNumber) {
  const client = await getAuthorizedClient();
  try {
    const response = await sheets.spreadsheets.values.get({
      auth: client,
      spreadsheetId: sheetId,
      range: `B${rowNumber}:I${rowNumber}`
    });
    const values = getValuesAndFlatten(response);
    const mainSong = values[0];
    const runThrough = values[1];
    const mainSongLink = values[6];
    const runThroughLink =
      values[1] === '' || values[1] === null
        ? `https://docs.google.com/spreadsheets/d/${sheetId}`
        : values[7];
    return {
      mainSong,
      mainSongLink,
      runThrough,
      runThroughLink
    };
  } catch (err) {
    console.log(
      `The API returned an error when trying to get song details: ${err}`
    );
    throw new Error(err);
  }
}

exports.getNextSongs = async function() {
  const rowNumber = await getRowNumber();
  return await getSongDetailsFromSheet(rowNumber);
};
