import express from 'express'
import bodyParser from 'body-parser'

import {
  testSlackIntegration,
  handleInteractions,
  oauth_redirect,
  oauth_error,
  oauth_success,
  handleSlashCommands
} from './slack'

import { testGoogleIntegration, putGoogleCredentials } from './google/google'
import { checkForJobsToday, processAttendance } from './cron'

let app: express.Application = express()
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req: express.Request, res: express.Response) => {
  res.send('Hello world! SHEbot v2.0')
})

app.get('/test-slack', testSlackIntegration)
app.get('/test-google', testGoogleIntegration)
app.put('/google-creds', putGoogleCredentials)
app.post('/interactions', handleInteractions)
app.get('/process-attendance', processAttendance)
app.get('/oauth_redirect', oauth_redirect)
app.get('/oauth_success', oauth_success)
app.get('/oauth_error', oauth_error)
app.post('/slash-commands', handleSlashCommands)
app.get('/cron', checkForJobsToday)

const PORT: number = parseInt(process.env.PORT) || 6060
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
  console.log('Press Ctrl+C to quit.')
})
