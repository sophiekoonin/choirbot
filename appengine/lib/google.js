const { google } = require('googleapis');
const moment = require('moment');
const utils = require('./utils');
const db = require('./db');

const { NODE_ENV } = process.env;
const sheets = google.sheets('v4');
function getValuesAndFlatten(response) {
  const { values } = response.data;
  return [].concat.apply([], values);
}

let auth,
  sheetId = null;
init();
async function init() {
  credentials = await utils.getDbOrConfigValue('tokens', 'google');
  auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    credentials
  });
  sheetId = await utils.getDbOrConfigValue('config', 'google', 'sheet_id');
}

async function getRowNumberForDate(sheetId, dateString) {
  const request = {
    auth,
    spreadsheetId: sheetId,
    range: 'A:A'
  };
  try {
    const response = await sheets.spreadsheets.values.get(request);
    const rowNumber = getValuesAndFlatten(response).indexOf(dateString) + 1;
    return rowNumber > 0 ? rowNumber : 1;
  } catch (err) {
    console.error(`Error getting row number: ${err}`);
    throw new Error(err);
  }
}

async function getSongDetailsFromSheet(sheetId, rowNumber) {
  try {
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: sheetId,
      range: `B${rowNumber}:I${rowNumber}`
    });
    const values = getValuesAndFlatten(response);
    const mainSong = values[0];
    const runThrough = values[1];
    const notes = values[2];
    const mainSongLink = values[6];
    const runThroughLink =
      values[1] === '' || values[1] === null
        ? `https://docs.google.com/spreadsheets/d/${sheetId}`
        : values[7];
    return {
      mainSong,
      mainSongLink,
      runThrough,
      runThroughLink,
      notes
    };
  } catch (err) {
    console.log(
      `The API returned an error when trying to get song details: ${err}`
    );
    throw new Error(err);
  }
}

exports.getNextSongs = async function(dateString) {
  try {
    const sheetId = await utils.getDbOrConfigValue(
      'config',
      'google',
      'sheet_id'
    );
    const rowNumber = await getRowNumberForDate(auth, sheetId, dateString);
    return await getSongDetailsFromSheet(auth, sheetId, rowNumber);
  } catch (err) {
    throw err;
  }
};

exports.putGoogleCredentials = async function(req, res) {
  const { credentials } = req.body;
  try {
    const document = await db.doc('tokens/google');
    document.update(credentials);
    res.status(201).send('Successfully set!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error setting google credentials', err);
  }
};

exports.testGoogleIntegration = async function(req, res) {
  try {
    const sheetId = await utils.getDbOrConfigValue(
      'config',
      'google',
      'sheet_id'
    );
    const testDate = '04/02/2019';
    const rowNumber = await getRowNumberForDate(auth, sheetId, testDate);
    res.status(200).send(`Row number is ${rowNumber}`);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};
