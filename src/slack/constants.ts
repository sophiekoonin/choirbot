export const Actions = {
  SELECT_REHEARSAL_DAY: 'rehearsal_day',
  YES_NO_REMINDERS: 'rehearsal_reminders',
  POST_CANCEL: 'post_cancel',
  SHOW_SHEET_MODAL: 'show_sheet_modal',
  SET_SHEET_ID: 'set_sheet_id',
  SET_BLOCKS: 'set_blocks'
}

export const ActionTypes = {
  STATIC_SELECT: 'static_select',
  BUTTON: 'button'
}

export const EventTypes = {
  APP_HOME_OPENED: 'app_home_opened'
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
