import { Router, Request, Response } from 'express'

const router = Router()

router.get('/jenis-nakes', (req: Request, res: Response) => {
  res.json({
    success: true,
    jenis: ['dokter', 'nakes', 'psikolog'],
  })
})

router.get('/status-transaksi', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: ['pending', 'berjalan', 'selesai'],
  })
})

export default router
