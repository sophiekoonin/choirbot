import {
  getAttendancePosts,
  getMostRecentAttendancePost,
  getReactionsForPost
} from '../attendance'
import { getUserReactionsForEmoji } from '../slack/utils'

export async function getVolunteerFacilitator(
  teamId: string,
  token: string,
  channel: string
) {
  const post = await getMostRecentAttendancePost(teamId)
  if (!post) {
    return
  }
  const ts = post.get('ts')
  const reactions = await getReactionsForPost(token, channel, ts)
  const facilitator = getUserReactionsForEmoji({
    reactions,
    emoji: 'raised_hands'
  })
  if (facilitator.length === 0) return null
  return facilitator[0]
}

export async function hasUserFacilitatedInLastFourWeeks(
  teamId: string,
  userId: string
) {
  const recentAttendancePosts = await getAttendancePosts(teamId, 4)
  if (recentAttendancePosts == null || recentAttendancePosts.length === 0) {
    return false
  }

  const hasFacilitated = recentAttendancePosts.some((post) => {
    const { roles } = post.data()
    if (roles == null) {
      return false
    }
    return roles.facilitator === userId
  })

  return hasFacilitated
}
