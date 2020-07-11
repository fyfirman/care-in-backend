import { Request, Response } from 'express'
import { getRepository } from 'typeorm'
import { validate } from 'class-validator'

import { RiwayatKesehatan } from '../entity/RiwayatKesehatan'

import validationDescriber from '../util/validationDescriber'

export const create = async (req: Request, res: Response) => {
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
    if (errors.length > 0) throw new Error('Data registrasi tidak valid')

    await riwayatKesRepo.save(riwayatKesehatan)

    res.status(201).json({ success: true, message: 'Berhasil menambah riwayat kesehatan' })
  } catch (err) {
    const constraints = validationDescriber(await validate(riwayatKesehatan))
    res.status(400).json({ success: false, message: err.message, constraints })
  }
}

export const getAll = async (req: Request, res: Response) => {
  const riwayatKesRepo = getRepository(RiwayatKesehatan)

  const { pasienId } = req.params
  const { limit, page } = req.query

  try {
    const riwayatKesehatan = await riwayatKesRepo.find({
      where: { pasienId },
      take: limit as any,
      skip: limit && page && ((page as any) - 1) * (limit as any),
    })

    res.json({
      success: true,
      message: 'Berhasil mengambil riwayat kesehatan',
      count: await riwayatKesRepo.count({ where: { pasienId } }),
      limit: parseInt(limit as string) || 0,
      page: parseInt(page as string) || 0,
      riwayatKesehatan,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const updateOne = async (req: Request, res: Response) => {
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
    if (errors.length > 0) throw new Error('Data registrasi tidak valid')

    await riwayatKesRepo.save(riwayatKesehatan)

    res.json({
      success: true,
      message: 'Berhasil update riwayat kesehatan',
    })
  } catch (err) {
    const constraints = validationDescriber(await validate(riwayatKesehatan))
    res.status(400).json({ success: false, message: err.message, constraints })
  }
}

export const deleteOne = async (req: Request, res: Response) => {
  const riwayatKesRepo = getRepository(RiwayatKesehatan)

  const id = req.params.id

  const riwayatKesehatan = await riwayatKesRepo.findOne(id)

  try {
    if (!riwayatKesehatan) throw new Error('Riwayat kesehatan tidak ditemukan')
    if (riwayatKesehatan.pasienId !== req.user.id) throw new Error('Akses tidak valid')

    await riwayatKesRepo.remove([riwayatKesehatan])

    res.json({
      success: true,
      message: 'Berhasil menghapus riwayat kesehatan',
    })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}
