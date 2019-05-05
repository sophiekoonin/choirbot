const { getAttendancePostMessage } = require('./utils');

describe('utils', () => {
  describe('getAttendancePostMessage', () => {
    it('should format correctly when there is no team updates meeting', () => {
      const notes = '';
      const mainSong = 'Bills Bills Bills';
      const runThrough = 'Poison';
      const result = getAttendancePostMessage({ mainSong, runThrough, notes });
      expect(result).toMatchSnapshot();
    });

    it('should format correctly when there is a team updates meeting', () => {
      const notes = 'blah blah Team Updates blah blah';
      const mainSong = 'Bills Bills Bills';
      const runThrough = 'Poison';
      const result = getAttendancePostMessage({ mainSong, runThrough, notes });
      expect(result).toMatchSnapshot();
    });
    it('should format correctly when there is no run through', () => {
      const mainSong = 'Bills Bills Bills';
      const notes = '';
      const result = getAttendancePostMessage({ mainSong, notes });
      expect(result).toMatchSnapshot();
    });
  });
});
