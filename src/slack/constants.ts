export const Actions = {
  FACILITATOR_ROULETTE: 'facilitator_roulette',
  SELECT_REHEARSAL_DAY: 'rehearsal_day',
  YES_NO_REMINDERS: 'rehearsal_reminders',
  POST_CANCEL: 'post_cancel',
  SHOW_SHEET_MODAL: 'show_sheet_modal',
  GOOGLE_SHEET_ID: 'google_sheet_id',
  POST_ATTENDANCE_MESSAGE: 'post_attendance_message',
  UPDATE_ATTENDANCE_MESSAGE: 'update_attendance_message',
  UPDATE_REHEARSAL_MESSAGE: 'update_rehearsal_message',
  POST_REHEARSAL_MESSAGE: 'post_rehearsal_message',
  SET_ATTENDANCE_BLOCKS: 'set_attendance_blocks',
  VIEW_REPORT: 'view_report',
  SHOW_IGNORE_MODAL: 'show_ignore_modal',
  SET_IGNORED_USERS: 'ignored_users',
  SET_CHANNEL: 'set_channel',
  DISABLE_CHOIRBOT: 'disable_choirbot',
  ENABLE_CHOIRBOT: 'enable_choirbot',
  DECLINE_FACILITATOR: 'decline_facilitator'
}

export const Interactions = {
  VIEW_SUBMISSION: 'view_submission'
}
export const ActionTypes = {
  STATIC_SELECT: 'static_select',
  BUTTON: 'button'
}

export const DaysOfWeek: { [key: string]: string } = {
  '1': 'Monday',
  '2': 'Tuesday',
  '3': 'Wednesday',
  '4': 'Thursday',
  '5': 'Friday',
  '6': 'Saturday',
  '0': 'Sunday'
}

export const AttendancePostSections = {
  INTRODUCTION: 'introduction',
  MAIN_SONG: 'main_song',
  RUN_THROUGH: 'run_through',
  NOTES: 'notes',
  CUSTOM_COLUMN: 'custom_column',
  ATTENDANCE_EMOJI: 'attendance_emoji',
  PHYSICAL_WARMUP: 'physical_warmup',
  GENERAL_WARMUP: 'general_warmup',
  MUSICAL_WARMUP: 'musical_warmup',
  FACILITATOR: 'facilitator',
  LOCKING_UP: 'locking_up'
}

export enum Emoji {
  PhysicalWarmup = 'muscle',
  GeneralWarmup = 'musical_note',
  MusicalWarmup = 'musical_note',
  Facilitator = 'raised_hands',
  Attending = '+1',
  NotAttending = '-1'
}
