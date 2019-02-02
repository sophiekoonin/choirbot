const express = require('express');

const {
  addAttendancePost,
  processAttendance,
  postRehearsalMusic,
  testSlackIntegration
} = require('./lib/slack');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello world! SHEbot v1.0');
});

app.get('/attendance', addAttendancePost);
app.get('/process', processAttendance);
app.get('/rehearsals', postRehearsalMusic);
app.get('/test', testSlackIntegration);

const PORT = process.env.PORT || 6060;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
