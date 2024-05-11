import { TeamId } from './types'
import { deleteCollection, db } from '../db'

export function onUninstall(teamId: TeamId) {
  db.collection('teams').doc(teamId).delete()
  deleteCollection(`attendance-${teamId}`, 20)

  return
}
