const { getAttendancePosts, getSlackUsers } = require('./slack');
const utils = require('./utils');

function getAttendanceValue(attendance, user_id) {
  if (attendance.attending.includes(user_id)) {
    return 'present';
  } else if (attendance.notAttending.includes(user_id)) {
    return 'absent';
  }
  return 'unknown';
}

exports.getAttendanceReport = async function(req, res) {
  const teamId = await utils.getDbOrConfigValue('config', 'slack', 'team_id');
  const allUsers = await getSlackUsers(teamId);
  const attendanceRecords = await getAttendancePosts(teamId, 50);
  const allAttendance = attendanceRecords.map(doc => ({
    date: doc.get('rehearsal_date'),
    attending: doc.get('attending'),
    notAttending: doc.get('notAttending')
  }));

  const allDates = allAttendance.map(record => record.date).sort();

  const usersWithAttendance = allUsers.map(user => {
    const attendance = allAttendance.reduce((acc, curr) => {
      acc[curr.date] = getAttendanceValue(curr, user.id);
      return acc;
    }, {});

    return {
      name: user.profile['real_name'],
      attendance: attendance
    };
  });
  res.status(200).send(
    JSON.stringify({
      dates: allDates,
      users: usersWithAttendance
    })
  );
};
