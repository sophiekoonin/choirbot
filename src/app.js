const express = require('express')
const bodyParser = require('body-parser')

const {
  testSlackIntegration,
  handleInteractions,
  handleEvents,
  oauth_redirect,
  oauth_error,
  oauth_success,
  handleSlashCommands
} = require('./slack')
const {
  testGoogleIntegration,
  putGoogleCredentials
} = require('./google/google')
const { checkForJobsToday, processAttendance } = require('./cron')

const app = express()

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.send('Hello world! SHEbot v1.2')
})

app.get('/test-slack', testSlackIntegration)
app.get('/test-google', testGoogleIntegration)
app.put('/google-creds', putGoogleCredentials)
app.post('/interactions', handleInteractions)
app.post('/events', handleEvents)
app.get('/process-attendance', processAttendance)
app.get('/oauth_redirect', oauth_redirect)
app.get('/oauth_success', oauth_success)
app.get('/oauth_error', oauth_error)
app.post('/slash-commands', handleSlashCommands)
app.get('/cron', checkForJobsToday)

const PORT = process.env.PORT || 6060
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
  console.log('Press Ctrl+C to quit.')
})
