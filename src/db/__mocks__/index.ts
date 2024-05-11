import { firestoreStub } from 'firestore-jest-mock/mocks/googleCloudFirestore'
import {
  testAttendancePost,
  testTeamData,
  testTeamId
} from '../../test/testData'
import { Firestore as FirestoreT } from '@google-cloud/firestore'

type TestDataOverrides = {
  teamOverrides?: Partial<typeof testTeamData>
  attendanceOverrides?: Partial<typeof testAttendancePost>
}

class DB {
  mockFirestore: FirestoreT
  constructor() {
    const { Firestore } = firestoreStub({
      database: {
        teams: [testTeamData],
        [`attendance-${testTeamId}`]: [testAttendancePost]
      }
    })
    this.mockFirestore = new Firestore()
  }
  collection(args: string) {
    return this.mockFirestore.collection(args)
  }

  setMockDbContents(overrides: TestDataOverrides) {
    const teamData = {
      ...testTeamData,
      ...overrides.teamOverrides
    }

    const attendanceData = {
      ...testAttendancePost,
      ...overrides.attendanceOverrides
    }
    const { Firestore } = firestoreStub({
      database: {
        teams: [teamData],
        [`attendance-${testTeamId}`]: [attendanceData]
      }
    })
    this.mockFirestore = new Firestore()
  }
}

const testDB = new DB()

export default testDB
