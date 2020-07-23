import { Request, Response, NextFunction } from 'express'
import { diskStorage } from 'multer'
import { join } from 'path'
import * as multer from 'multer'
import { mkdirSync } from 'fs'
import responseLogger from '../util/responseLogger'

const ROOTDIR = join(__dirname, '..', '../')

const storage = diskStorage({
  destination: (req: Request, file, cb) => {
    const { fieldname } = file
    const dest = ROOTDIR + 'public/upload/' + fieldname
    mkdirSync(dest, { recursive: true })
    cb(null, dest)
  },
  filename: (req: Request, file, cb) => {
    const { originalname } = file
    const filename = Date.now() + '_' + originalname
    cb(null, filename)
  },
})

const fileFilter = (req: Request, file, cb) => {
  const { mimetype } = file
  if (mimetype.includes('image')) cb(null, true)
  else cb(new Error('File bukan gambar'))
}

const multerFoto = multer({ storage, fileFilter }).single('foto')

export const uploadFoto = (req: Request, res: Response, next: NextFunction) => {
  multerFoto(req, res, (err) => {
    try {
      if (err) throw new Error(err.message)
      next()
    } catch (err) {
      responseLogger(req.method, 400, req.baseUrl + req.path, err.message)
      res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  })
}
