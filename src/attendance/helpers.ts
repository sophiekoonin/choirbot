import { db } from '../db'
import { TeamId } from '../slack/types'

export async function getAttendancePosts(team_id: TeamId, limit?: number) {
  const result = db
    .collection(`attendance-${team_id}`)
    .orderBy('created_at', 'desc')

  if (limit != null) {
    const slice = await result.limit(limit).get()
    return slice.docs
  }

  const snapshot = await result.get()
  return snapshot.docs
}
