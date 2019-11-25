import * as utils from '../utils'

export const getToken = async function(team_id: string) {
  return await utils.getDbOrConfigValue('teams', team_id, 'token')
}

// export const verifySigningSecret = async function(req) {
//   const
// }
