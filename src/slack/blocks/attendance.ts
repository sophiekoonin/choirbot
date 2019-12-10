import { SectionBlock } from '@slack/types'
import { AttendancePostSections } from '../constants'

function getSongLink(songName: string, songLink: string): string {
  if (songLink == null || songLink === '') {
    return `${songName}`
  }
  if (songLink.includes(',')) {
    return `${songName} - ${songLink}`
  }
  return `<${songLink}|${songName}>`
}

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

export function mainSongBlock({
  mainSong,
  mainSongLink
}: {
  mainSong: string
  mainSongLink: string
}): SectionBlock {
  return {
    type: 'section',
    block_id: AttendancePostSections.MAIN_SONG,
    text: {
      type: 'mrkdwn',
      text: `*We're singing*: ${getSongLink(mainSong, mainSongLink)}`
    }
  }
}

export function runThroughBlock({
  runThrough,
  runThroughLink
}: {
  runThrough: string
  runThroughLink: string
}): SectionBlock | null {
  if (runThrough == null || runThrough === '') return
  return {
    type: 'section',
    block_id: AttendancePostSections.RUN_THROUGH,
    text: {
      type: 'mrkdwn',
      text: `*Run through*: ${getSongLink(runThrough, runThroughLink)}`
    }
  }
}

export function notesBlock({ notes }: { notes: string }): SectionBlock | null {
  if (notes == null || notes === '') return null
  return {
    type: 'section',
    block_id: AttendancePostSections.NOTES,
    text: {
      type: 'mrkdwn',
      text: `:information_source: ${notes}`
    }
  }
}

export const physicalWarmupBlock: SectionBlock = {
  type: 'section',
  block_id: AttendancePostSections.PHYSICAL_WARMUP,
  text: {
    type: 'mrkdwn',
    text: 'To volunteer for physical warmup, respond with :muscle:.'
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

export const initialIntroText = ':tada: Rehearsal day! :tada: <!channel>'
export const initialBlocks = [
  AttendancePostSections.MAIN_SONG,
  AttendancePostSections.ATTENDANCE_EMOJI
]
