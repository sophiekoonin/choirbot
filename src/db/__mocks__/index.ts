import { firestoreStub } from 'firestore-jest-mock/mocks/googleCloudFirestore'
import {
  testAttendancePost,
  testTeamData,
  testTeamId
} from '../../test/testData'

let attendanceData = testAttendancePost

const { Firestore } = firestoreStub({
  database: {
    teams: [testTeamData],
    [`attendance-${testTeamId}`]: [attendanceData]
  }
})

const db = new Firestore()
db.setAttendanceData = (data: typeof testAttendancePost) => {
  attendanceData = data
}
export default db
