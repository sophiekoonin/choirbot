const functions = require('firebase-functions');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
const slack = require('slack');

const auth = require('./auth');
const attendance = require('./attendance');
const rehearsals = require('./rehearsals');
const google = require('./google');
const { env, teamid } = functions.config().shebot;

admin.initializeApp();
admin.firestore().settings({ timestampsInSnapshots: true });
exports.getSlackToken = function() {
  return env === 'prod'
    ? admin
        .firestore()
        .collection('tokens')
        .doc(teamid)
        .get()
        .then(doc => {
          if (!doc.exists) {
            throw new Error('Token not found');
          } else {
            return doc.get('token');
          }
        })
    : functions.config().slack.token;
};

exports.ping = functions
  .region('europe-west1')
  .https.onRequest((request, response) => {
    getSlackToken()
      .then(token => slack.auth.test({ token }))
      .then(res => {
        console.log(res);
        return res;
      })
      .then(res =>
        response.send(
          `SHE slash commands up and running! v0.2 \n Slack auth status: ${res}`
        )
      )
      .catch(err => console.error(err));
  });

exports.addAttendancePost = attendance.addAttendancePost;
exports.oauth_redirect = auth.oauth_redirect;
exports.processAttendance = attendance.processAttendance;
// exports.postRehearsalMusic = rehearsals.postRehearsalMusic;
exports.authGoogleAPI = google.authGoogleAPI;
exports.googleOauthRedirect = google.googleOauthRedirect;

// eslint-disable-next-line
Date.prototype.format = function() {
  return `${this.getDate()}/${this.getMonth() + 1}/${this.getFullYear()}`;
};
