const slack = require('slack');
const db = require('../db');

exports.handleSlashCommands = async (req, res) => {
  const { text, team_id } = req.body;
  const textAsArray = text.split(' ');
  const command = textAsArray[0];
  switch (command) {
    case 'sheet':
      setGoogleSheetId(team_id, textAsArray[1]);
      return res.send(
        `I've set your Google Sheets ID to \`${
          textAsArray[1]
        }\` - if that's not right, you can do this again to reset it.`
      );
    default:
      return res.send("Sorry, I didn't understand that!");
  }
};

async function setGoogleSheetId(teamId, sheetId) {
  await db.updateDbValue('teams', teamId, { google_sheet_id: sheetId });
}
