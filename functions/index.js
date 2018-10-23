const functions = require('firebase-functions');
const fetch = require('node-fetch');
const admin = require('firebase-admin');

const auth = require('./auth');
const attendance = require('./attendance');

admin.initializeApp();

exports.ping = functions
  .region('europe-west1')
  .https.onRequest((request, response) => {
    response.send('SHE slash commands up and running! v0.1.3');
  });

exports.addAttendancePost = attendance.addAttendancePost;
exports.oauth_redirect = auth.oauth_redirect;
