import { Router, Request, Response } from 'express'

const router = Router()

router.get('/jenis-nakes', (req: Request, res: Response) => {
  res.json({
    success: true,
    jenis: ['dokter', 'perawat', 'psikolog'],
  })
})
