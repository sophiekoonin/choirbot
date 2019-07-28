const { addAttendancePost, processAttendance } = require('./attendance');
const { testSlackIntegration } = require('./test');
const { postRehearsalMusic } = require('./rehearsals');
const { handleInteractions, handleEvents } = require('./interactions');
const { oauth_redirect, oauth_error, oauth_success } = require('./oauth');
const { getAttendanceReport } = require('./reports');
const { startConfigFlow } = require('./config');
const { handleSlashCommands } = require('./slash-commands');

module.exports = {
  addAttendancePost,
  processAttendance,
  testSlackIntegration,
  postRehearsalMusic,
  handleEvents,
  handleInteractions,
  oauth_redirect,
  oauth_error,
  oauth_success,
  getAttendanceReport,
  startConfigFlow,
  handleSlashCommands
};
