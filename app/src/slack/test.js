const slack = require('slack');
const utils = require('../utils');

exports.testSlackIntegration = async function(req, res) {
  try {
    const { team_id } = req.query;
    if (!team_id || team_id === '') {
      return res.sendStatus(200);
    }
    const [channel_id, token] = await utils.getDbOrConfigValues(
      'teams',
      team_id,
      ['channel_id', 'token']
    );

    await slack.chat.postMessage({
      token,
      text: 'Test post, please ignore!',
      username: 'Attendance Bot Test',
      as_user: false,
      channel: channel_id
    });
    return res.sendStatus(200);
  } catch (err) {
    console.log('Error trying to test slack:', err);
    return res.sendStatus(500);
  }
};
