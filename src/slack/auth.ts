const utils = require('../utils')

exports.getToken = async function(team_id: string) {
  return await utils.getDbOrConfigValue('teams', team_id, 'token')
}

// exports.verifySigningSecret = async function(req) {
//   const
// }
