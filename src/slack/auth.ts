import { getValue } from '../db'

export const getToken = async function(team_id: string) {
  return await getValue('teams', team_id, 'token')
}

// export const verifySigningSecret = async function(req) {
//   const
// }
