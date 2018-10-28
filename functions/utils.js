const admin = require('firebase-admin');
const functions = require('firebase-functions');
const moment = require('moment');
const env = functions.config().shebot.env;

exports.getNextMonday = function() {
  const today = moment().day();
  const monday = today > 1 ? 8 : 1; //set day of week according to whether today is before sunday or not - see Moment.js docs
  return moment()
    .day(monday)
    .format('DD/MM/YYYY');
};

exports.getTokenAndPostOptions = function() {
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
};
