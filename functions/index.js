const functions = require('firebase-functions');
const fetch = require('node-fetch');
const admin = require('firebase-admin');

const auth = require('./auth');
const attendance = require('./attendance');
const rehearsals = require('./rehearsals');

admin.initializeApp();
admin.firestore().settings({ timestampsInSnapshots: true });
exports.ping = functions
  .region('europe-west1')
  .https.onRequest((request, response) => {
    response.send('SHE slash commands up and running! v0.1.3');
  });

exports.addAttendancePost = attendance.addAttendancePost;
exports.oauth_redirect = auth.oauth_redirect;
exports.registerAttendance = attendance.registerAttendance;
exports.postRehearsalMusic = rehearsals.postRehearsalMusic;
exports.test = functions
  .region('europe-west1')
  .https.onRequest((request, response) => {
    return admin
      .firestore()
      .collection('tokens')
      .doc('token')
      .get()
      .then(doc => {
        if (!doc.exists) {
          throw new Error('Token not found');
        } else {
          return doc.get('token');
        }
      })
      .then(value => {
        return response.send(`Data is ${value}`);
      })
      .catch(err => console.error(err));
  });
