const db = require('../db');
const {
  onSlackInstall,
  respondToRehearsalDaySelected,
  respondToYesNoRehearsalReminders
} = require('./config');
const { Actions, ActionTypes } = require('./constants');

exports.handleInteractions = async (req, res) => {
  const { payload } = req.body;
  const { response_url, actions, team } = JSON.parse(payload);
  const action = actions[0];
  const { block_id, type } = action;

  let value, text;
  switch (type) {
    case ActionTypes.STATIC_SELECT:
      text = action.selected_option.text.text;
      value = action.selected_option.value;
      break;
    case ActionTypes.BUTTON:
      text = action.text.text;
      value = action.value;
      break;
  }

  db.collection('teams')
    .doc(team.id)
    .update({
      [block_id]: value
    });

  switch (block_id) {
    case Actions.SELECT_REHEARSAL_DAY:
      respondToRehearsalDaySelected({
        responseUrl: response_url,
        selectedOptionText: text
      });
      break;
    case Actions.YES_NO_REMINDERS:
      respondToYesNoRehearsalReminders({
        responseUrl: response_url,
        selectedOption: value
      });
      break;
    default:
      break;
  }

  return res.sendStatus(200);
};

exports.handleEvents = async (req, res) => {
  const { type, team_id, token } = req.body;
  if (type === 'url_verification') {
    return res.send(req.body.challenge);
  }

  const { user, channel, type: eventType } = req.body.event;
  if (eventType === 'app_home_opened') {
    await onSlackInstall({ teamId: team_id, userId: channel });
  }
  return res.sendStatus(200);
};

// {
// 	"type": "block_actions",
// 	"team": {
// 		"id": "T0CAG",
// 		"domain": "acme-creamery"
// 	},
// 	"user": {
// 		"id": "U0CA5",
// 		"username": "Amy McGee",
// 		"name": "Amy McGee",
// 		"team_id": "T3MDE"
// 	},
// 	"api_app_id": "A0CA5",
// 	"token": "Shh_its_a_seekrit",
// 	"container": {
// 		"type": "message",
// 		"text": "The contents of the original message where the action originated"
// 	},
// 	"trigger_id": "12466734323.1395872398",
// 	"response_url": "https://www.postresponsestome.com/T123567/1509734234",
// 	"actions": [
// 		{
// 			"type": "static_select",
// 			"block_id": "section791937301",
// 			"action_id": "section734454127",
// 			"selected_option": {
// 				"text": {
// 					"type": "plain_text",
// 					"text": "Sunday",
// 					"emoji": true
// 				},
// 				"value": "0"
// 			},
// 			"placeholder": {
// 				"type": "plain_text",
// 				"text": "Select an item",
// 				"emoji": true
// 			},
// 			"action_ts": "1564233206.940052"
// 		}
// 	]
// }
