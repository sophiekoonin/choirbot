import { TeamId } from './types'
import { db, deleteCollection } from '../db'

export function onUninstall(teamId: TeamId) {
  db.collection('teams').doc(teamId).delete()
  deleteCollection(`attendance-${teamId}`, 20)
  
  return
}
