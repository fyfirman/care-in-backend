import { Request, Response } from 'express'
import { getRepository } from 'typeorm'
import { validate } from 'class-validator'

import { RiwayatKesehatan } from '../entity/RiwayatKesehatan'

import validationDescriber from '../util/validationDescriber'
import responseLogger from '../util/responseLogger'

export const createRiwayatKesehatan = async (req: Request, res: Response) => {
  const riwayatKesRepo = getRepository(RiwayatKesehatan)

  const { pasienId } = req.params
  const { tanggal, namaPenyakit } = req.body

  const riwayatKesehatan = new RiwayatKesehatan()

  try {
    if (req.params.pasienId !== req.user.id) throw new Error('Akses tidak valid')

    riwayatKesehatan.pasienId = pasienId
    riwayatKesehatan.tanggal = new Date(tanggal)
    riwayatKesehatan.namaPenyakit = namaPenyakit

    const errors = await validate(riwayatKesehatan)
    if (errors.length > 0) throw new Error('Data tidak valid')

    await riwayatKesRepo.save(riwayatKesehatan)

    responseLogger(req.method, 201, req.baseUrl + req.path)
    res.status(201).json({ success: true, message: 'Berhasil menambah riwayat kesehatan' })
  } catch (err) {
    const constraints = validationDescriber(await validate(riwayatKesehatan))
    let statusCode = 500

    if (err.message === 'Akses tidak valid') statusCode = 403
    if (err.message === 'Data tidak valid') statusCode = 400

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({ success: false, message: err.message, constraints })
  }
}

export const getManyRiwayatKesehatan = async (req: Request, res: Response) => {
  const riwayatKesRepo = getRepository(RiwayatKesehatan)

  const { pasienId } = req.params
  const { limit, page } = req.query

  try {
    const riwayatKesehatan = await riwayatKesRepo.find({
      where: { pasienId },
      take: limit as any,
      skip: limit && page && ((page as any) - 1) * (limit as any),
    })

    responseLogger(req.method, 200, req.baseUrl + req.path)
    res.json({
      success: true,
      message: 'Berhasil mengambil riwayat kesehatan',
      count: await riwayatKesRepo.count({ where: { pasienId } }),
      limit: parseInt(limit as string) || 0,
      page: parseInt(page as string) || 0,
      riwayatKesehatan,
    })
  } catch (err) {
    let statusCode = 500
    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({ success: false, message: err.message })
  }
}

export const updateOneRiwayatKesehatan = async (req: Request, res: Response) => {
  const riwayatKesRepo = getRepository(RiwayatKesehatan)

  const id = req.params.id

  const { tanggal, namaPenyakit } = req.body

  const riwayatKesehatan = await riwayatKesRepo.findOne(id)
  try {
    if (!riwayatKesehatan) throw new Error('Riwayat kesehatan tidak ditemukan')
    if (riwayatKesehatan.pasienId !== req.user.id) throw new Error('Akses tidak valid')

    if (tanggal) riwayatKesehatan.tanggal = new Date(tanggal)
    if (namaPenyakit) riwayatKesehatan.namaPenyakit = namaPenyakit

    const errors = await validate(riwayatKesehatan)
    if (errors.length > 0) throw new Error('Data tidak valid')

    await riwayatKesRepo.save(riwayatKesehatan)

    responseLogger(req.method, 200, req.baseUrl + req.path)
    res.json({
      success: true,
      message: 'Berhasil update riwayat kesehatan',
    })
  } catch (err) {
    const constraints = validationDescriber(await validate(riwayatKesehatan))
    let statusCode = 500

    if (err.message === 'Riwayat kesehatan tidak ditemukan') statusCode = 404
    if (err.message === 'Akses tidak valid') statusCode = 403
    if (err.message === 'Data tidak valid') statusCode = 400

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({ success: false, message: err.message, constraints })
  }
}

export const deleteOneRiwayatKesehatan = async (req: Request, res: Response) => {
  const riwayatKesRepo = getRepository(RiwayatKesehatan)

  const id = req.params.id

  const riwayatKesehatan = await riwayatKesRepo.findOne(id)

  try {
    if (!riwayatKesehatan) throw new Error('Riwayat kesehatan tidak ditemukan')
    if (riwayatKesehatan.pasienId !== req.user.id) throw new Error('Akses tidak valid')

    await riwayatKesRepo.remove([riwayatKesehatan])

    responseLogger(req.method, 202, req.baseUrl + req.path)
    res.json({
      success: true,
      message: 'Berhasil menghapus riwayat kesehatan',
    })
  } catch (err) {
    let statusCode = 500
    if (err.message === 'Riwayat kesehatan tidak ditemukan') statusCode = 404
    if (err.message === 'Akses tidak valid') statusCode = 403

    responseLogger(req.method, statusCode, req.baseUrl + req.path, err.message)
    res.status(statusCode).json({ success: false, message: err.message })
  }
}
