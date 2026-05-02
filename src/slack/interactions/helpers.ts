import { BlockTypes } from '../blocks/constants'
import { SubmissionValues } from '../types'

export function getConfigSubmissionValues(values: SubmissionValues) {
  const valuesToUpdate = Object.keys(values).reduce(
    (acc: Record<string, string | string[] | undefined>, curr: string) => {
      const item = values[curr][curr]
      if (item == null) return acc
      switch (item.type) {
        case BlockTypes.PLAIN_TEXT_INPUT:
          return { ...acc, [curr]: item.value }
        case BlockTypes.MULTI_STATIC_SELECT:
          return {
            ...acc,
            [curr]: item.selected_options
              ?.map((option) => option.value)
              .filter((v): v is string => v != null)
          }
        case BlockTypes.MULTI_USERS_SELECT:
          return {
            ...acc,
            [curr]: item.selected_users
          }
        default:
          return acc
      }
    },
    {} as Record<string, string | string[] | undefined>
  )
  return valuesToUpdate
}
