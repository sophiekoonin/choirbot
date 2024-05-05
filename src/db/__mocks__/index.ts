import { firestoreStub } from 'firestore-jest-mock/mocks/googleCloudFirestore'
import { testAttendancePost, testTeamData } from '../../test/testData'
const { Firestore } = firestoreStub({
  database: {
    teams: [testTeamData],
    'attendance-T12345': [testAttendancePost]
  }
})

const db = new Firestore()
export default db
