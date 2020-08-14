import { Request, Response } from 'express'
import responseLogger from '../util/responseLogger'

export const createNotifikasi = async (req: Request, res: Response) => {
  try {
    if (!(req.body.token && req.body.title && req.body.message))
      throw new Error('Data tidak boleh kosong')

    responseLogger(req.method, 201, req.baseUrl + req.path)
    res.status(201).json({ success: true, message: 'Berhasil mengirim notifikasi' })
  } catch (err) {
    let statusCode = 500

    if (err.message === 'Data tidak boleh kosong') statusCode = 400

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({ success: false, message: err.message })
  }
}