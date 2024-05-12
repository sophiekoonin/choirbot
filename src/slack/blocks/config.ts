import { AttendancePostSections, Emoji } from '../constants'
import { PlainTextOption } from '@slack/types'

export const AttendanceBlockSelectors: PlainTextOption[] = [
  {
    text: {
      type: 'plain_text',
      emoji: true,
      text: `Volunteer to facilitate with :${Emoji.Facilitator}:`
    },
    value: AttendancePostSections.FACILITATOR
  },
  {
    text: {
      type: 'plain_text',
      emoji: true,
      text: 'Volunteer to open up/lock up'
    },
    value: AttendancePostSections.LOCKING_UP
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
      text: `Volunteer for warmup with :${Emoji.GeneralWarmup}:`
    },
    value: AttendancePostSections.GENERAL_WARMUP
  },
  {
    text: {
      type: 'plain_text',
      emoji: true,
      text: `Volunteer for musical warmup with :${Emoji.MusicalWarmup}:`
    },
    value: AttendancePostSections.MUSICAL_WARMUP
  },
  {
    text: {
      type: 'plain_text',
      emoji: true,
      text: `Volunteer for physical warmup with :${Emoji.PhysicalWarmup}:`
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
      text: 'Custom Column (column G)'
    },
    value: AttendancePostSections.CUSTOM_COLUMN
  },
  {
    text: {
      type: 'plain_text',
      text: `React with :${Emoji.Attending}::${Emoji.NotAttending}: if attending/not attending`,
      emoji: true
    },
    value: AttendancePostSections.ATTENDANCE_EMOJI
  },
  {
    text: {
      type: 'plain_text',
      text: 'Register with 👍 - covid rehearsals',
      emoji: true
    },
    value: 'thumbs-covid'
  }
]
