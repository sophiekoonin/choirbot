const express = require('express');
const bodyParser = require('body-parser');

const { getDbOrConfigValue, getDbOrConfigValues } = require('./utils');

const {
  addAttendancePost,
  processAttendance,
  postRehearsalMusic,
  testSlackIntegration,
  handleInteractions,
  handleEvents,
  getAttendanceReport,
  oauth_redirect,
  oauth_error,
  oauth_success
} = require('./slack');
const { testGoogleIntegration, putGoogleCredentials } = require('./google');

const app = express();

app.use(bodyParser.json()); // for parsing application/json

app.get('/', (req, res) => {
  res.send('Hello world! SHEbot v1.2');
});

app.get('/attendance', addAttendancePost);
app.get('/process', processAttendance);
app.get('/rehearsals', postRehearsalMusic);
app.get('/test-slack', testSlackIntegration);
app.get('/test-google', testGoogleIntegration);
app.put('/google-creds', putGoogleCredentials);
app.get('/report', getAttendanceReport);
app.post('/interactions', handleInteractions);
app.post('/events', handleEvents);
app.get('/oauth_redirect', oauth_redirect);
app.get('/oauth_success', oauth_success);
app.get('/oauth_error', oauth_error);

const PORT = process.env.PORT || 6060;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
