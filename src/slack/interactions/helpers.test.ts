import { testUser2 } from '../../test/testData'
import { getConfigSubmissionValues } from './helpers'

describe('Slack interactions helpers', () => {
  test('getConfigSubmissionValues wrangles submission values', () => {
    expect(
      getConfigSubmissionValues({
        ignored_users: {
          ignored_users: {
            type: 'multi_users_select',
            selected_users: [testUser2]
          }
        }
      })
    ).toEqual({
      ignored_users: [testUser2]
    })
    expect(
      getConfigSubmissionValues({
        spreadsheet_id: {
          spreadsheet_id: {
            type: 'plain_text_input',
            value: 'some-url'
          }
        }
      })
    ).toEqual({
      spreadsheet_id: 'some-url'
    })
    expect(
      getConfigSubmissionValues({
        favourite_cheeses: {
          favourite_cheeses: {
            type: 'multi_static_select',
            selected_options: [
              {
                value: 'cheddar',
                text: { type: 'plain_text', text: 'Extra Mature Cheddar' }
              },
              {
                value: 'brie',
                text: { type: 'plain_text', text: 'Brie de Meaux' }
              }
            ]
          }
        }
      })
    ).toEqual({
      favourite_cheeses: ['cheddar', 'brie']
    })
  })
})
