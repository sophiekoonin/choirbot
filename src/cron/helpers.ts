import { db, getQueryResults } from '../db'

export async function getActiveTeamsWithRehearsalOnDate(
  date: Date,
  extraWhereBool?: string
) {
  const day = date.getDay().toString()
  let query = db
    .collection('teams')
    .where('rehearsal_day', '==', day)
    .where('active', '==', true)

  if (extraWhereBool) {
    query = query.where(extraWhereBool, '==', true)
  }

  try {
    const teams = await getQueryResults(query)
    if (teams.length === 0) {
      console.log('Found no teams with rehearsal on day', day)
      return []
    }
    console.log(
      'Found teams with rehearsal on day:',
      day,
      teams.map((t) => t.id)
    )
    return teams
  } catch (error) {
    console.error(error)
  }
  return []
}
