import { getAttendancePosts } from '../attendance'

export async function pickRandomAttendee(
  _attendees: string[],
  teamId: string,
  musicalWarmUpVolunteer: string | null,
  physicalWarmUpVolunteer: string | null
) {
  const previousFacilitators = []
  let attendees = _attendees.filter(
    (a) => a !== musicalWarmUpVolunteer && a !== physicalWarmUpVolunteer
  )

  while (attendees.length > 0) {
    const randomAttendee =
      attendees[Math.floor(Math.random() * attendees.length)]
    const hasRecentlyFacilitated = await hasUserFacilitatedInLastFourWeeks(
      teamId,
      randomAttendee
    )
    if (hasRecentlyFacilitated) {
      previousFacilitators.push(randomAttendee)
      attendees = attendees.filter((attendee) => attendee !== randomAttendee)
    } else {
      return randomAttendee
    }
  }

  return null
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
