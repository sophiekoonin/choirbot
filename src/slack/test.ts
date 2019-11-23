const slack = require('slack')
const utils = require('../utils')

exports.testSlackIntegration = async (req, res) => {
  try {
    const { team_id: teamId } = req.query
    if (!teamId || teamId === '') {
      return res.sendStatus(200)
    }
    const [userId, token] = await utils.getDbOrConfigValues('teams', teamId, [
      'user_id',
      'bot_access_token'
    ])

    await slack.chat.postMessage({
      token,
      text: 'Test post, please ignore!',
      username: 'Attendance Bot Test',
      as_user: true,
      channel: userId
    })
    return res.sendStatus(200)
  } catch (err) {
    console.error('Error trying to test slack:', err)
    return res.sendStatus(500)
  }
}
