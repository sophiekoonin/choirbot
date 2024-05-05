import { TeamId } from './types'
import { deleteCollection, getDb } from '../db'

export function onUninstall(teamId: TeamId) {
  getDb().collection('teams').doc(teamId).delete()
  deleteCollection(`attendance-${teamId}`, 20)

  return
}
