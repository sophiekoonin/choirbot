exports.testSlackIntegration = async function(req, res) {
  try {
    const [team_id, channel_id] = await utils.getDbOrConfigValues(
      'config',
      'slack',
      ['team_id', 'channel_id']
    );
    const token = await getToken(team_id);
    await slack.chat.postMessage({
      token,
      text: 'Test post, please ignore!',
      username: 'Attendance Bot Test',
      as_user: false,
      channel: channel_id
    });
    res.status(200).send();
  } catch (err) {
    console.log('Error trying to test slack:', err);
  }
};
