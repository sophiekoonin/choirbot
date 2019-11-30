export const postAttendanceMessageButton = {
  type: 'button',
  text: {
    type: 'plain_text',
    emoji: true,
    text: 'Attendance post'
  },
  style: 'primary',
  value: 'post_attendance'
}

export const postRehearsalMessageButton = {
  type: 'button',
  text: {
    type: 'plain_text',
    emoji: true,
    text: 'Rehearsal post'
  },
  style: 'primary',
  value: 'post_rehearsal'
}

export const cancelButton = {
  type: 'button',
  text: {
    type: 'plain_text',
    emoji: true,
    text: 'Cancel'
  },
  style: 'danger',
  value: 'cancel'
}
