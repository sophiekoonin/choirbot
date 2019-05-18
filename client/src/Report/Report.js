import React from 'react';

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
      users: [],
      error: null
    };
    this.renderAttendanceTable = this.renderAttendanceTable.bind(this);
  }

  componentDidCatch(error) {
    this.setState({
      error: error
    });
  }

  async componentDidMount() {
    try {
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/report`);

      const attendanceData = await res.json();
      this.setState({
        dates: attendanceData.dates,
        users: attendanceData.users,
        isLoading: false
      });
    } catch (error) {
      this.setState({
        isLoading: false
      });
      throw error;
    }
  }

  renderHeaderRows(dates) {
    return (
      <tr>
        <th />
        {dates
          .sort((a, b) => new Date(a) - new Date(b))
          .map(date => (
            <th key={date}>{date}</th>
          ))}
      </tr>
    );
  }

  renderUsersWithAttendance(dates, users) {
    function renderUserAttendance(user) {
      return dates
        .sort((a, b) => new Date(a) - new Date(b))
        .map(date => {
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
