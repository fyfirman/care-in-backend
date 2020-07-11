import { Request, Response, NextFunction } from 'express'
import { verify } from 'jsonwebtoken'

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const tokenHeader = req.header('Authorization')

  try {
    if (!tokenHeader) throw new Error()
    if (tokenHeader.split(' ')[0] !== 'Bearer') throw new Error()
    const token = tokenHeader.split(' ')[1]

    const decoded = verify(token, process.env.JWT_SECRET) as object

    req.user = (<any>decoded).user
    req.tokenIat = new Date(0).setUTCSeconds((<any>decoded).iat)
    req.tokenExp = new Date(0).setUTCSeconds((<any>decoded).exp)
    next()
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau masa berlaku sudah habis',
    })
  }
}
