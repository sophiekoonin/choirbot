import React from 'react';
import attendanceData from './test.json';

function getAttendanceSymbol(attendance) {
  switch (attendance) {
    case 'present':
      return '✅';
    case 'absent':
      return '👎';
    default:
      return '❌';
  }
}
class Report extends React.Component {
  constructor() {
    super();
    this.state = {
      isLoading: true,
      dates: [],
      users: []
    };
    this.renderAttendanceTable = this.renderAttendanceTable.bind(this);
  }
  async componentDidMount() {
    // const attendanceData = await fetch(
    //   'https://shechoirlondon-977.appspot.com/report'
    // );

    this.setState({
      dates: attendanceData.dates,
      users: attendanceData.users,
      isLoading: false
    });
  }

  renderHeaderRows(dates) {
    return (
      <tr>
        <th />
        {dates.map(date => (
          <th key={date}>{date}</th>
        ))}
      </tr>
    );
  }

  renderUsersWithAttendance(dates, users) {
    function renderUserAttendance(user) {
      return dates.map(date => {
        const className = user.attendance[date]
          ? user.attendance[date]
          : 'unknown';

        return (
          <td key={`${user.name}-${date}`} className={className}>
            {getAttendanceSymbol(user.attendance[date])}
          </td>
        );
      });
    }
    const sortedUsers = users.sort((a, b) =>
      a.name.split(' ')[0].toLowerCase() < b.name.split(' ')[0].toLowerCase()
        ? -1
        : a.name.split(' ')[0].toLowerCase() >
          b.name.split(' ')[0].toLowerCase()
        ? 1
        : 0
    );
    return sortedUsers.map(user => (
      <tr key={user.name}>
        <td>{user.name}</td>
        {renderUserAttendance(user)}
      </tr>
    ));
  }
  renderAttendanceTable() {
    const { dates, users } = this.state;
    return (
      <table>
        <tbody>
          {this.renderHeaderRows(dates)}
          {this.renderUsersWithAttendance(dates, users)}
        </tbody>
      </table>
    );
  }

  render() {
    const { isLoading } = this.state;
    return isLoading ? 'Loading...' : this.renderAttendanceTable();
  }
}

export default Report;
