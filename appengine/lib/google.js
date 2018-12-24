const { google } = require('googleapis');
const moment = require('moment');
const utils = require('./utils');
const db = require('./db');

const { NODE_ENV } = process.env;
const sheetId = utils.getDbOrConfigValue('config', 'google', 'sheet_id');
const sheets = google.sheets('v4');

const auth = google.auth.getClient({
  // Scopes can be specified either as an array or as a single, space-delimited string.
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

async function getRowNumberForDate(dateString) {
  const request = {
    auth,
    spreadsheetId: sheetId,
    range: 'A:A'
  };
  try {
    const response = await sheets.spreadsheets.values.get(request);
    const rowNumber = getValuesAndFlatten(response).indexOf(dateString) + 1;
    if (rowNumber === 0) return 1;
    return rowNumber;
  } catch (err) {
    console.error(`Error getting row number: ${err}`);
    throw new Error(err);
  }
}

async function getSongDetailsFromSheet(rowNumber) {
  try {
    const response = await sheets.spreadsheets.values.get({
      auth,
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

exports.getNextSongs = async function(dateString) {
  const rowNumber = await getRowNumberForDate(dateString);
  return await getSongDetailsFromSheet(rowNumber);
};