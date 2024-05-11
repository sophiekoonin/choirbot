import { firestoreStub } from 'firestore-jest-mock/mocks/googleCloudFirestore'
import { testAttendancePost, testTeamData, testTeamId } from './testData'

type TestDataOverrides = {
  teamOverrides?: Partial<typeof testTeamData>
  attendanceOverrides?: Partial<typeof testAttendancePost>
}

export function testDBFactory({
  teamOverrides,
  attendanceOverrides
}: TestDataOverrides = {}) {
  const teamData = {
    ...testTeamData,
    ...teamOverrides
  }

  const attendanceData = {
    ...testAttendancePost,
    ...attendanceOverrides
  }
  const { Firestore } = firestoreStub({
    database: {
      teams: [teamData],
      [`attendance-${testTeamId}`]: [attendanceData]
    }
  })
  return new Firestore()
}
