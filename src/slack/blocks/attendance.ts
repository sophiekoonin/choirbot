import { SectionBlock } from '@slack/types'
import { AttendancePostSections } from '../constants'
import { SongData } from '../../google/types'

export const introductionBlock = (text: string): SectionBlock => ({
  type: 'section',
  block_id: AttendancePostSections.INTRODUCTION,
  text: {
    type: 'mrkdwn',
    text
  }
})

export const attendanceEmojiBlock: SectionBlock = {
  type: 'section',
  block_id: 'thumbs',
  text: {
    type: 'mrkdwn',
    text:
      'Please indicate whether or not you can attend tonight by reacting to this message with :thumbsup: (present) or :thumbsdown: (absent).'
  }
}

export const musicalWarmupBlock: SectionBlock = {
  type: 'section',
  block_id: AttendancePostSections.MUSICAL_WARMUP,
  text: {
    type: 'mrkdwn',
    text: 'If you want to lead musical warmup, respond with :musical_note:.'
  }
}

export function mainSongBlock({ mainSong }: SongData): SectionBlock {
  return {
    type: 'section',
    block_id: AttendancePostSections.MAIN_SONG,
    text: {
      type: 'mrkdwn',
      text: `*Today's rehearsal*: ${mainSong}`
    }
  }
}

export function runThroughBlock({ runThrough }: SongData): SectionBlock {
  return {
    type: 'section',
    block_id: AttendancePostSections.RUN_THROUGH,
    text: {
      type: 'mrkdwn',
      text: `*Run through*: ${runThrough}`
    }
  }
}

export function notesBlock({ notes }: SongData): SectionBlock {
  return {
    type: 'section',
    block_id: AttendancePostSections.NOTES,
    text: {
      type: 'mrkdwn',
      text: notes
    }
  }
}

export const physicalWarmupBlock: SectionBlock = {
  type: 'section',
  block_id: AttendancePostSections.PHYSICAL_WARMUP,
  text: {
    type: 'mrkdwn',
    text:
      'To volunteer for physical warmup, respond with :muscle:. \nFor musical warmup, respond with :musical_note:.'
  }
}

export const facilitatorBlock: SectionBlock = {
  type: 'section',
  block_id: AttendancePostSections.FACILITATOR,
  text: {
    type: 'mrkdwn',
    text: 'Facilitator please respond with :raised_hands:!'
  }
}

export const AttendanceBlocks = {
  [AttendancePostSections.NOTES]: notesBlock,
  [AttendancePostSections.MUSICAL_WARMUP]: musicalWarmupBlock,
  [AttendancePostSections.PHYSICAL_WARMUP]: physicalWarmupBlock,
  [AttendancePostSections.FACILITATOR]: facilitatorBlock,
  [AttendancePostSections.MAIN_SONG]: mainSongBlock,
  [AttendancePostSections.RUN_THROUGH]: runThroughBlock,
  [AttendancePostSections.ATTENDANCE_EMOJI]: attendanceEmojiBlock
}
