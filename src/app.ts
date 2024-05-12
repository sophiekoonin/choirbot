import express, { Response } from 'express'
import bodyParser from 'body-parser'

import {
  handleInteractions,
  oauth_redirect,
  oauth_error,
  oauth_success,
  verifyRequestSignature,
  handleEvents
} from './slack'

import { checkForJobsToday } from './cron/cron'
import { Request } from './types'
import { runFacilitatorRouletteCronJob } from './cron/roulette'

const app: express.Application = express()
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
    verify: function (req: Request, _: Response, buf: Buffer) {
      // get text body and add it as a field for signature verification
      req.text = buf.toString()
    }
  })
)

app.get('/', (req: express.Request, res: express.Response) => {
  res.send('Hello world! SHEbot v2.1')
})

app.post('/interactions', verifyRequestSignature, handleInteractions)
app.get('/oauth_redirect', oauth_redirect)
app.post('/events', handleEvents)
app.get('/oauth_success', oauth_success)
app.get('/oauth_error', oauth_error)
app.get('/cron', checkForJobsToday)
app.get('/roulette', runFacilitatorRouletteCronJob)

const PORT: number = parseInt(process.env.PORT) || 6060
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
  console.log('Press Ctrl+C to quit.')
})

app.on('error', (err) => {
  console.error(err)
})
