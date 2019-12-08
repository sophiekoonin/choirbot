import { SectionBlock } from '@slack/types'
import { AttendancePostSections } from '../constants'

export const musicalWarmupBlock: SectionBlock = {
  type: 'section',
  block_id: AttendancePostSections.MUSICAL_WARMUP,
  text: {
    type: 'mrkdwn',
    text: 'If you want to lead musical warmup, respond with :musical_note:.'
  }
}

export function mainSongBlock(mainSong: string): SectionBlock {
  return {
    type: 'section',
    block_id: AttendancePostSections.MAIN_SONG,
    text: {
      type: 'mrkdwn',
      text: `*Today's rehearsal*: ${mainSong}`
    }
  }
}

export function runThroughBlock(runThrough: string): SectionBlock {
  return {
    type: 'section',
    block_id: AttendancePostSections.RUN_THROUGH,
    text: {
      type: 'mrkdwn',
      text: `*Run through*: ${runThrough}`
    }
  }
}

export const teamUpdatesBlock: SectionBlock = {
  type: 'section',
  block_id: AttendancePostSections.TEAM_UPDATES,
  text: {
    type: 'mrkdwn',
    text: '*Team updates meeting at 6:30!* All welcome.'
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
