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

exports.getDbOrConfigValue = async function(collection, docName, key) {
  if (NODE_ENV !== 'prod') {
    return config[docName][key];
  } else {
    return await db.getValue(collection, docName, key);
  }
};

exports.getDbOrConfigValues = async function(collection, docName, keys) {
  if (NODE_ENV !== 'prod') {
    return keys.map(key => config[docName][key]);
  } else {
    return await db.getValues(collection, docName, keys);
  }
};
