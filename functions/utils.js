const moment = require('moment');
const fetch = require('node-fetch');

exports.getNextMonday = function() {
  const today = moment().day();
  const monday = today > 1 ? 8 : 1; //set day of week according to whether today is before sunday or not - see Moment.js docs
  return moment()
    .day(monday)
    .format('DD/MM/YYYY');
};

exports.isBankHoliday = async function(date) {
  const dateFormatted = moment(date).format('YYYY-MM-DD');
  const response = await fetch('https://www.gov.uk/bank-holidays.json');
  const allBankHols = await response.json();
  const { events } = allBankHols['england-and-wales'];
  const allDates = events.map(evt => evt.date);
  return allDates.includes(dateFormatted);
};

exports.getRehearsalMusicMessage = function({
  mainSong,
  mainSongLink,
  runThrough,
  runThroughLink
}) {
  return `<!channel> Here's the plan for Monday's rehearsal! \n
  We'll be doing ${mainSong} - ${mainSongLink ||
    "I can't find a link for this - please check the Arrangements Folder!"} \n
  *Run through*: ${
    runThrough ? runThrough : 'No information - please check schedule:'
  } - ${runThroughLink} \n
  Please make sure you've listened to the recordings! :sparkles:`;
};

exports.getAttendancePostMessage = function(
  { mainSong = 'please check schedule for details!', runThrough },
  message
) {
  return (
    ':dancing_banana: Rehearsal day! :dancing_banana: <!channel> \n' +
    `*Today's rehearsal:* ${mainSong}\n` +
    ` ${runThrough && `*Run through:* ${nextWeekSongs.runThrough}\n`}` +
    `${message && `*Important note:* ${message}\n`}` +
    'Please indicate whether or not you can attend tonight by reacting to this message with :thumbsup: ' +
    '(present) or :thumbsdown: (absent).\n' +
    'Facilitator please respond with :raised_hands:!\n' +
    'To volunteer for Physical warm up, respond with :muscle: ' +
    'For Musical warm up, respond with :musical_note:.'
  );
};
