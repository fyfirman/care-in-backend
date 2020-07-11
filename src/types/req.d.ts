declare namespace Express {
  export interface Request {
    user?: {
      id: string
      username: string
    }
    tokenIat?: number
    tokenExp?: number
  }
}
