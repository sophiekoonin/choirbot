const moment = require('moment');
const fetch = require('node-fetch');
const memcache = require('memory-cache');
const db = require('./db');

const { NODE_ENV } = process.env;
const config = NODE_ENV === 'dev' ? require('../config.json') : {};

exports.formatDateISO = function(date) {
  return moment(date).format('YYYY-MM-DD');
};

slashDateToISO = function(date) {
  const parts = date.split('/');
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

exports.getNextMonday = function() {
  const today = moment().day();
  const monday = today > 1 ? 8 : 1; //set day of week according to whether today is before sunday or not - see Moment.js docs
  return moment()
    .day(monday)
    .format('DD/MM/YYYY');
};

exports.isBankHoliday = async function(date) {
  const dateFormatted = slashDateToISO(date);
  let allBankHols;
  allBankHols = memcache.get('bank-holidays');
  if (!allBankHols) {
    const response = await fetch('https://www.gov.uk/bank-holidays.json');
    allBankHols = await response.json();
    memcache.put('bank-holidays', allBankHols);
  }
  const { events } = allBankHols['england-and-wales'];
  const allDates = events.map(evt => evt.date);
  return allDates.includes(dateFormatted);
};

exports.getRehearsalMusicMessage = function({
  mainSong,
  mainSongLink,
  runThrough,
  runThroughLink,
  notes
}) {
  return `<!channel> Here's the plan for Monday's rehearsal! \n
  ${
    notes.toLowerCase().includes('team updates')
      ? 'Team updates meeting at 6:30! All welcome :tada:\n'
      : ''
  }
  We'll be doing ${mainSong} - ${mainSongLink ||
    "I can't find a link for this - please check the Arrangements Folder!"} \n
  *Run through*: ${
    runThrough ? runThrough : 'Please check the schedule for more info.'
  } ${runThroughLink ? ' - ' + runThroughLink : ''} \n
  Please give the recordings a listen! :sparkles:`;
};

exports.getAttendancePostMessage = function({
  mainSong = 'please check schedule for details!',
  runThrough,
  notes
}) {
  return (
    ':dancing_banana: Rehearsal day! :dancing_banana: <!channel> \n' +
    `*Today's rehearsal:* ${mainSong}\n` +
    ` ${runThrough ? `*Run through:* ${runThrough}\n\n` : ''}` +
    ` ${
      notes.toLowerCase().includes('team updates')
        ? '*Team updates meeting at 6:30! All welcome* :tada:\n'
        : ''
    }` +
    'Please indicate whether or not you can attend tonight by reacting to this message with :thumbsup: ' +
    '(present) or :thumbsdown: (absent).\n' +
    'Facilitator please respond with :raised_hands:!\n' +
    'To volunteer for Physical warm up, respond with :muscle: ' +
    'For Musical warm up, respond with :musical_note:.'
  );
};

const getDbDoc = async function(collection, docName) {
  console.log('collection', collection);
  return await db
    .collection(collection)
    .doc(docName)
    .get();
};

exports.getDocData = async function(collection, docName) {
  const doc = await getDbDoc(collection, docName);
  return await doc.data();
};

exports.getDbOrConfigValue = async function(collection, docName, key) {
  if (NODE_ENV !== 'prod') {
    return config[docName][key];
  } else {
    const doc = await getDbDoc(collection, docName);
    if (!doc.exists) {
      throw new Error(`Config not found for ${docName}-${key}`);
    } else {
      return doc.get(key);
    }
  }
};

exports.getDbOrConfigValues = async function(collection, docName, keys) {
  if (NODE_ENV !== 'prod') {
    return keys.map(key => config[docName][key]);
  } else {
    const doc = await db
      .collection(collection)
      .doc(docName)
      .get();
    if (!doc.exists) {
      throw new Error(`Config not found for ${docName}`);
    } else {
      const data = doc.data();
      return keys.map(key => data[key]);
    }
  }
};
