import { Request as ExpressReq } from 'express'

export interface Request extends ExpressReq {
  text: string
}
