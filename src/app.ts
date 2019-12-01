import express, { Response } from 'express'
import bodyParser from 'body-parser'

import {
  handleInteractions,
  oauth_redirect,
  oauth_error,
  oauth_success,
  handleSlashCommands,
  verifyRequestSignature
} from './slack'

import { checkForJobsToday } from './cron'
import { Request } from './types'

let app: express.Application = express()
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
    verify: function(req: Request, _: Response, buf: Buffer) {
      // get text body and add it as a field for signature verification
      req.text = buf.toString()
    }
  })
)

app.get('/', (req: express.Request, res: express.Response) => {
  res.send('Hello world! SHEbot v2.1')
})

app.post('/interactions', verifyRequestSignature, handleInteractions)
app.get('/oauth_redirect', verifyRequestSignature, oauth_redirect)
app.get('/oauth_success', oauth_success)
app.get('/oauth_error', oauth_error)
app.post('/slash-commands', verifyRequestSignature, handleSlashCommands)
app.get('/cron', checkForJobsToday)

const PORT: number = parseInt(process.env.PORT) || 6060
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
  console.log('Press Ctrl+C to quit.')
})
