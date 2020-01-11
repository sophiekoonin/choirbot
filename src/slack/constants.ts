export const Actions = {
  SELECT_REHEARSAL_DAY: 'rehearsal_day',
  YES_NO_REMINDERS: 'rehearsal_reminders',
  POST_CANCEL: 'post_cancel',
  SHOW_SHEET_MODAL: 'show_sheet_modal',
  GOOGLE_SHEET_ID: 'google_sheet_id',
  POST_ATTENDANCE_MESSAGE: 'post_attendance_message',
  POST_REHEARSAL_MESSAGE: 'post_rehearsal_message',
  SET_ATTENDANCE_BLOCKS: 'set_attendance_blocks',
  VIEW_REPORT: 'view_report',
  SHOW_IGNORE_MODAL: 'show_ignore_modal',
  SET_IGNORED_USERS: 'ignored_users',
  SET_CHANNEL: 'set_channel'
}

export const Interactions = {
  VIEW_SUBMISSION: 'view_submission'
}
export const ActionTypes = {
  STATIC_SELECT: 'static_select',
  BUTTON: 'button'
}

export const Blocks = {
  INTRO_TEXT: 'intro_text',
  ATTENDANCE_BLOCKS: 'attendance_blocks'
}

export const EventTypes = {
  APP_HOME_OPENED: 'app_home_opened',
  URL_VERIFICATION: 'url_verification',
  APP_UNINSTALLED: 'app_uninstalled'
}

export const BlockTypes = {
  PLAIN_TEXT_INPUT: 'plain_text_input',
  MULTI_STATIC_SELECT: 'multi_static_select',
  MULTI_USERS_SELECT: 'multi_users_select'
}

export const DaysOfWeek: { [key: string]: string } = {
  '1': 'Monday',
  '2': 'Tuesday',
  '3': 'Wednesday',
  '4': 'Thursday',
  '5': 'Friday',
  '6': 'Saturday',
  '7': 'Sunday'
}

export const AttendancePostSections = {
  INTRODUCTION: 'introduction',
  MAIN_SONG: 'main_song',
  RUN_THROUGH: 'run_through',
  NOTES: 'notes',
  ATTENDANCE_EMOJI: 'attendance_emoji',
  PHYSICAL_WARMUP: 'physical_warmup',
  MUSICAL_WARMUP: 'musical_warmup',
  FACILITATOR: 'facilitator'
}
