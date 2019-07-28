const moment = require('moment')
const { db, getQueryResults } = require('./db')

exports.checkForJobsToday = async (req, res) => {
  const today = moment()
    .day()
    .toString()

  const todayQuery = db.collection('teams').where('rehearsal_day', '==', today)
  const teams = await getQueryResults(todayQuery)
  if (teams.length === 0) {
    return res.sendStatus(200)
  }

  // teams.forEach(team => {
  //   const { team}
  // })
  // get today's day of week
  // check each team for their day of week
  // if there's a match, do the post
}
