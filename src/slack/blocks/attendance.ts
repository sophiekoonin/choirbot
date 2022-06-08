import { ActionsBlock, SectionBlock, HeaderBlock } from '@slack/types'
import { AttendancePostButtons, AttendancePostSections } from '../constants'

function newSectionBlock(text: string, blockId: string): SectionBlock {
  return {
    type: 'section',
    block_id: blockId,
    text: {
      type: 'mrkdwn',
      text
    }
  }
}

function getSongLink(songName: string, songLink: string): string {
  if (songLink == null || songLink === '') {
    return `${songName}`
  }
  if (songLink.includes(',')) {
    return `${songName} - ${songLink}`
  }
  return `<${songLink}|${songName}>`
}

export const introductionBlock = (text: string): SectionBlock =>
  newSectionBlock(text, AttendancePostSections.INTRODUCTION)

export const headerBlock = (text: string): HeaderBlock => ({
  type: 'header',
  text: {
    type: 'plain_text',
    text
  }
})

export const attendanceEmojiBlock: SectionBlock = newSectionBlock(
  'Please indicate whether or not you can attend tonight by reacting to this message with :thumbsup: (present) or :thumbsdown: (absent).',
  'thumbs'
)

const physicalWarmupButton = {
  type: 'button',
  text: {
    type: 'plain_text',
    text: `:muscle: I'll lead physical warmup`,
    emoji: true
  },
  value: AttendancePostButtons.VOLUNTEER_PHYSICAL_WARMUP
}

const musicalWarmupButton = {
  type: 'button',
  text: {
    type: 'plain_text',
    text: `:musical_note: I'll lead musical warmup`,
    emoji: true
  },
  value: AttendancePostButtons.VOLUNTEER_MUSICAL_WARMUP
}

export const warmupButtonsBlock = ({
  volunteer_physical_warmup: physicalWarmupVolunteer,
  volunteer_musical_warmup: musicalWarmupVolunteer
}: {
  [AttendancePostButtons.VOLUNTEER_PHYSICAL_WARMUP]?: string
  [AttendancePostButtons.VOLUNTEER_MUSICAL_WARMUP]?: string
}): Array<ActionsBlock | SectionBlock> => {
  const physicalWarmupText = physicalWarmupVolunteer
    ? `:muscle: *Physical warmup:* <@${physicalWarmupVolunteer}>`
    : undefined
  const musicalWarmupText = musicalWarmupVolunteer
    ? `:musical_note: *Musical warmup:* <@${musicalWarmupVolunteer}>`
    : undefined

  let warmupActionsBlock: ActionsBlock

  if (physicalWarmupText && musicalWarmupText) {
    warmupActionsBlock = undefined
  } else {
    warmupActionsBlock = {
      type: 'actions',
      block_id: AttendancePostSections.WARMUP_BUTTONS,
      elements: [
        physicalWarmupText ? undefined : physicalWarmupButton,
        musicalWarmupText ? undefined : musicalWarmupButton
      ].filter(Boolean)
    }
  }

  return [
    physicalWarmupText
      ? newSectionBlock(physicalWarmupText, 'phys_warmup_name')
      : undefined,
    warmupActionsBlock,
    musicalWarmupText
      ? newSectionBlock(musicalWarmupText, 'mus_warmup_name')
      : undefined
  ].filter(Boolean)
}

export const genericWarmupBlock: SectionBlock = {
  type: 'section',
  block_id: AttendancePostSections.GENERAL_WARMUP,
  text: {
    type: 'mrkdwn',
    text: 'If you want to lead warmup, respond with :musical_note:.'
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

export function notesBlock({
  notes,
  showEmoji = true
}: {
  notes: string
  showEmoji?: boolean
}): SectionBlock | null {
  if (notes == null || notes === '') return null
  return {
    type: 'section',
    block_id: AttendancePostSections.NOTES,
    text: {
      type: 'mrkdwn',
      text: `${showEmoji ? ':information_source: ' : ''}${notes}`
    }
  }
}

export function customColumnBlock({
  customColumnValue,
  customColumnHeader
}: {
  customColumnValue: string
  customColumnHeader: string
}): SectionBlock | null {
  if (customColumnValue == null || customColumnValue === '') return null
  return {
    type: 'section',
    block_id: AttendancePostSections.CUSTOM_COLUMN,
    text: {
      type: 'mrkdwn',
      text: `*${customColumnHeader.trim()}*: ${customColumnValue}`
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
    type: 'plain_text',
    text: `:raised_hands: I'll facilitate`,
    emoji: true
  }
}

export const facilitatorButtonBlock = ({
  volunteer_facilitator: facilitatorVolunteer
}: {
  [AttendancePostButtons.VOLUNTEER_FACILITATOR]?: string
}): ActionsBlock | SectionBlock =>
  facilitatorVolunteer
    ? newSectionBlock(
        `:raised_hands: *Facilitator:* <@${facilitatorVolunteer}>`,
        'facilitator_name'
      )
    : {
        type: 'actions',
        block_id: AttendancePostSections.FACILITATOR,
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: `:raised_hands: I'll facilitate`,
              emoji: true
            },
            value: AttendancePostButtons.VOLUNTEER_FACILITATOR
          }
        ]
      }

const pickUpKeyButton = {
  type: 'button',
  text: {
    type: 'plain_text',
    text: `:key: I'll pick up the key`,
    emoji: true
  },
  value: AttendancePostButtons.VOLUNTEER_COLLECT_KEY
}

const lockUpButton = {
  type: 'button',
  text: {
    type: 'plain_text',
    text: `:lock: I'll lock up`,
    emoji: true
  },
  value: AttendancePostButtons.VOLUNTEER_LOCKING_UP
}

export const lockingUpBlock = ({
  volunteer_locking_up: lockupVolunteer,
  volunteer_collect_key: pickupVolunteer
}: {
  [AttendancePostButtons.VOLUNTEER_LOCKING_UP]?: string
  [AttendancePostButtons.VOLUNTEER_COLLECT_KEY]?: string
}): Array<SectionBlock | ActionsBlock> => {
  const lockupText = lockupVolunteer
    ? newSectionBlock(
        `:lock: *Locking up:* <@${lockupVolunteer}>`,
        'lockup_name'
      )
    : undefined
  const pickupText = pickupVolunteer
    ? newSectionBlock(
        `:key: *Picking up the key:* <@${pickupVolunteer}>`,
        'pickup_name'
      )
    : undefined

  const introText = !(lockupText && pickupText)
    ? newSectionBlock(
        `We need a volunteer to ${
          !pickupText ? 'pick up the key from the Canopy hotel today' : ''
        }${!pickupText && !lockupText ? ' and someone else to ' : ''}${
          !lockupText ? 'lock up & take the key back after rehearsal' : ''
        }.`,
        `${AttendancePostSections.LOCKING_UP}-intro`
      )
    : undefined

  const actions: ActionsBlock | undefined = !(lockupText && pickupText)
    ? {
        type: 'actions',
        block_id: AttendancePostSections.LOCKING_UP,
        elements: [
          pickupText ? undefined : pickUpKeyButton,
          lockupText ? undefined : lockUpButton
        ].filter(Boolean)
      }
    : undefined

  return [pickupText, introText, actions, lockupText].filter(Boolean)
}

export const AttendanceBlocks = {
  [AttendancePostSections.NOTES]: notesBlock,
  [AttendancePostSections.WARMUP_BUTTONS]: warmupButtonsBlock,
  [AttendancePostSections.FACILITATOR_BUTTONS]: facilitatorButtonBlock,
  [AttendancePostSections.GENERAL_WARMUP]: genericWarmupBlock,
  [AttendancePostSections.CUSTOM_COLUMN]: customColumnBlock,
  [AttendancePostSections.FACILITATOR]: facilitatorBlock,
  [AttendancePostSections.LOCKING_UP]: lockingUpBlock,
  [AttendancePostSections.MAIN_SONG]: mainSongBlock,
  [AttendancePostSections.RUN_THROUGH]: runThroughBlock,
  [AttendancePostSections.ATTENDANCE_EMOJI]: attendanceEmojiBlock
}

export const initialIntroText = ':tada: Rehearsal day! :tada: <!channel>'
export const initialBlocks = [
  AttendancePostSections.MAIN_SONG,
  AttendancePostSections.ATTENDANCE_EMOJI
]
