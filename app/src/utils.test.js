const {
  getAttendancePostMessage,
  getRehearsalMusicMessage
} = require('./utils')

describe('utils', () => {
  describe('getAttendancePostMessage', () => {
    it('should format correctly when there is no team updates meeting', () => {
      const notes = ''
      const mainSong = 'Bills Bills Bills'
      const runThrough = 'Poison'
      const result = getAttendancePostMessage({ mainSong, runThrough, notes })
      expect(result).toMatchSnapshot()
    })

    it('should format correctly when there is a team updates meeting', () => {
      const notes = 'blah blah Team Updates blah blah'
      const mainSong = 'Bills Bills Bills'
      const runThrough = 'Poison'
      const result = getAttendancePostMessage({ mainSong, runThrough, notes })
      expect(result).toMatchSnapshot()
    })
    it('should format correctly when there is no run through', () => {
      const mainSong = 'Bills Bills Bills'
      const notes = ''
      const result = getAttendancePostMessage({ mainSong, notes })
      expect(result).toMatchSnapshot()
    })
  })

  describe('getRehearsalMusicMessage', () => {
    it('should format correctly with all bits present', () => {
      const args = {
        mainSong: 'Hide and Seek',
        mainSongLink: 'link-to-hideandseek',
        runThrough: 'Dreams',
        runThroughLink: 'link-to-dreams',
        notes: 'Something something team updates 6:30'
      }
      const result = getRehearsalMusicMessage(args)
      expect(result).toMatchSnapshot()
    })
    it('should format correctly with no main song link', () => {
      const args = {
        mainSong: 'Hide and Seek',
        runThrough: 'Dreams',
        runThroughLink: 'link-to-dreams',
        notes: 'Something something team updates 6:30'
      }
      const result = getRehearsalMusicMessage(args)
      expect(result).toMatchSnapshot()
    })
    it('should format correctly with no run through', () => {
      const args = {
        mainSong: 'Hide and Seek',
        mainSongLink: 'link-to-hideandseek',
        notes: 'Something something team updates 6:30'
      }
      const result = getRehearsalMusicMessage(args)
      expect(result).toMatchSnapshot()
    })
    it('should format correctly with run through but no link', () => {
      const args = {
        mainSong: 'Hide and Seek',
        mainSongLink: 'link-to-hideandseek',
        runThrough: 'Dreams',
        notes: 'Something something team updates 6:30'
      }
      const result = getRehearsalMusicMessage(args)
      expect(result).toMatchSnapshot()
    })
    it('should format correctly with no team updates', () => {
      const args = {
        mainSong: 'Hide and Seek',
        mainSongLink: 'link-to-hideandseek',
        runThrough: 'Dreams',
        runThroughLink: 'link-to-dreams',
        notes: ''
      }
      const result = getRehearsalMusicMessage(args)
      expect(result).toMatchSnapshot()
    })
  })
})
