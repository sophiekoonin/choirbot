import { AttendancePostSections } from '../constants'
import { Option } from '@slack/types'

export const AttendanceBlockSelectors: Option[] = [
  {
    text: {
      type: 'plain_text',
      emoji: true,
      text: 'Volunteer to facilitate with 🙌'
    },
    value: AttendancePostSections.FACILITATOR
  },
  {
    text: {
      type: 'plain_text',
      text: 'Notes'
    },
    value: AttendancePostSections.NOTES
  },
  {
    text: {
      type: 'plain_text',
      emoji: true,
      text: 'Volunteer for warmup with 🎵'
    },
    value: AttendancePostSections.GENERAL_WARMUP
  },
  {
    text: {
      type: 'plain_text',
      emoji: true,
      text: 'Volunteer for musical warmup with 🎵'
    },
    value: AttendancePostSections.MUSICAL_WARMUP
  },
  {
    text: {
      type: 'plain_text',
      emoji: true,
      text: 'Volunteer for physical warmup with 💪'
    },
    value: AttendancePostSections.PHYSICAL_WARMUP
  },
  {
    text: {
      type: 'plain_text',
      text: 'Main song'
    },
    value: AttendancePostSections.MAIN_SONG
  },
  {
    text: {
      type: 'plain_text',
      text: 'Run through song'
    },
    value: AttendancePostSections.RUN_THROUGH
  },
  {
    text: {
      type: 'plain_text',
      text: 'React with 👍👎 if attending/not attending',
      emoji: true
    },
    value: AttendancePostSections.ATTENDANCE_EMOJI
  }
]
