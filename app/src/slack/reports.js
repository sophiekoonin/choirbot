const slack = require('slack');
const { getAttendancePosts } = require('./attendance');
const { getToken } = require('./auth');
const utils = require('../utils');

function flattenDeep(arr1) {
  return arr1.reduce(
    (acc, val) =>
      Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val),
    []
  );
}

async function getSlackUsers(teamId) {
  const token = await getToken(teamId);
  const { members } = await slack.users.list({ token });
  return members
    .filter(member => !member.deleted)
    .filter(member => !member.is_bot)
    .filter(member => member.id !== 'USLACKBOT');
}

async function getSlackUserIds(team_id) {
  const token = await getToken(team_id);
  const { members } = await slack.users.list({ token });
  return members
    .filter(member => !member.deleted)
    .filter(member => !member.is_bot)
    .map(member => member.id)
    .filter(id => id !== 'USLACKBOT');
}

function getAttendanceValue(attendance, user_id) {
  if (attendance.attending.includes(user_id)) {
    return 'present';
  } else if (attendance.notAttending.includes(user_id)) {
    return 'absent';
  }
  return 'unknown';
}

exports.getAttendanceReport = async function(teamId) {
  const allUsers = await getSlackUsers(teamId);
  const attendanceRecords = await getAttendancePosts(teamId, 10);
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
  return {
    dates: allDates,
    users: usersWithAttendance
  };
};

/*
1. Fetch last 4 rehearsals
2. Filter list of users against attending/not attending 
3. Show who hasn't responded
 */
exports.reportAttendance = async function(teamId) {
  const lastFourWeeks = await getAttendancePosts(teamId, 4);
  const allUsers = await getSlackUserIds(teamId);
  const postData = lastFourWeeks.map(post => ({
    attending: post.get('attending'),
    notAttending: post.get('notAttending'),
    date: post.get('rehearsal_date')
  }));
  const responded = flattenDeep(
    postData.map(post => [post.attending, post.notAttending])
  );
  const notResponded = allUsers.filter(user => !responded.includes(user));
  return `*Not responded in last 4 weeks:* \n${notResponded
    .map(uid => `<@${uid}>`)
    .join('\n')}`;
};
