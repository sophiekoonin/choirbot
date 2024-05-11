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
  attendance?: Array<typeof testAttendancePost>
  teams?: Array<typeof testTeamData>
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

  setMockDbContents(testData: TestDataOverrides) {
    const { attendance, teams, teamOverrides, attendanceOverrides } = testData
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
        teams: teams ? teams : [teamData],
        [`attendance-${testTeamId}`]: attendance ? attendance : [attendanceData]
      }
    })
    this.mockFirestore = new Firestore()
  }
}

const testDB = new DB()

export const db = testDB
