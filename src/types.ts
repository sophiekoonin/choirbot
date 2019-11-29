import { Request } from 'express'

export interface Request extends Request {
  text: string
}
