const { getAttendancePosts, getSlackUsers } = require('.');
const utils = require('../utils');

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

/*
1. Fetch last 4 rehearsals
2. Filter list of users against attending/not attending 
3. Show who hasn't responded
 */
exports.reportAttendance = async function(req, res) {
  const team_id = await utils.getDbOrConfigValue('config', 'slack', 'team_id');
  const lastFourWeeks = await getAttendancePosts(team_id, 4);
  const allUsers = await getSlackUserIds(team_id);
  const postData = lastFourWeeks.map(post => ({
    attending: post.get('attending'),
    notAttending: post.get('notAttending'),
    date: post.get('rehearsal_date')
  }));
  const responded = flattenDeep(
    postData.map(post => [post.attending, post.notAttending])
  );
  const notResponded = allUsers.filter(user => !responded.includes(user));
  await res.send(
    `Not responded: ${notResponded.map(uid => `<@${uid}>`).join(', ')}`
  );
};
