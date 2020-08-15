import { Request, Response } from 'express'
import responseLogger from '../util/responseLogger'
import * as admin from 'firebase-admin'

export const createNotifikasi = async (req: Request, res: Response) => {
  try {
    if (!(req.body.token && req.body.title && req.body.body))
      throw new Error('Data tidak boleh kosong')

    const payload = {
      data: req.body.data,
      notification: {
        title: req.body.title,
        body: req.body.body
      }
    }

    admin.messaging().sendToDevice(req.body.token, payload)
      .then((response) => {
        if (response.results[0].error) {
          responseLogger(req.method, 400, req.baseUrl + req.path, "Firebase error")
          res.status(400).json({ success: false, error: response.results })
        } else {
          responseLogger(req.method, 200, req.baseUrl + req.path)
          res.status(201).json({
            success: true,
            message: `Berhasil mengirim notifikasi.`,
            payload,
            response
          })
        }
      }
      ).catch((error) => {
        responseLogger(req.method, 400, req.baseUrl + req.path, error.message)
        res.status(400).json({ success: false, message: error.message })
      })

  } catch (err) {
    let statusCode = 500

    if (err.message === 'Data tidak boleh kosong') statusCode = 400

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({ success: false, message: err.message })
  }
}