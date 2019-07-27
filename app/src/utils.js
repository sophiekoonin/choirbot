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

const getDbDoc = async function(collection, docName) {
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
