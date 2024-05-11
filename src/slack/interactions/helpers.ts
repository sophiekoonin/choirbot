import { BlockTypes } from '../constants'
import { SubmissionValues } from '../types'

export function getConfigSubmissionValues(values: SubmissionValues) {
  const valuesToUpdate = Object.keys(values).reduce((acc, curr) => {
    const item = values[curr][curr]
    if (item == null) return
    switch (item.type) {
      case BlockTypes.PLAIN_TEXT_INPUT:
        return { ...acc, [curr]: item.value }
      case BlockTypes.MULTI_STATIC_SELECT:
        return {
          ...acc,
          [curr]: item.selected_options.map((option) => option.value)
        }
      case BlockTypes.MULTI_USERS_SELECT:
        return {
          ...acc,
          [curr]: item.selected_users
        }
      default:
        return acc
    }
  }, {})
  return valuesToUpdate
}
